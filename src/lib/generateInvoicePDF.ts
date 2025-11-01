import { PDFDocument, StandardFonts, rgb, PDFImage } from "pdf-lib";
import { ReservationFormData } from "./types/freeTrials";

export interface InvoiceOptions {
    companyLogo?: Buffer | Uint8Array;
    companyName?: string;
    companyAddress?: string;
    companyTaxNumber?: string;
}

export async function generateInvoicePDF(
    reservation: ReservationFormData,
    invoiceNumber: string,
    options: InvoiceOptions = {}
): Promise<string> {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page with professional dimensions (A4 size)
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
    const { width, height } = page.getSize();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.6);
    const secondaryColor = rgb(0.3, 0.3, 0.3);
    const accentColor = rgb(0.9, 0.1, 0.1);
    const lightGray = rgb(0.9, 0.9, 0.9);
    const darkGray = rgb(0.4, 0.4, 0.4);

    // Draw company logo if provided
    let logo: PDFImage | undefined;
    if (options.companyLogo) {
        try {
            logo = await pdfDoc.embedPng(options.companyLogo);
            const logoDims = logo.scale(0.3);
            page.drawImage(logo, {
                x: 50,
                y: height - 100,
                width: logoDims.width,
                height: logoDims.height,
            });
        } catch (error) {
            console.warn('Failed to embed logo:', error);
        }
    }

    // Header section
    const headerY = height - 80;

    // Company info
    if (options.companyName) {
        page.drawText(options.companyName, {
            x: logo ? 200 : 50,
            y: headerY,
            size: 18,
            font: helveticaBold,
            color: primaryColor,
        });
    }

    if (options.companyAddress) {
        page.drawText(options.companyAddress, {
            x: logo ? 200 : 50,
            y: headerY - 20,
            size: 10,
            font: helveticaFont,
            color: darkGray,
        });
    }

    if (options.companyTaxNumber) {
        page.drawText(`Tax Number: ${options.companyTaxNumber}`, {
            x: logo ? 200 : 50,
            y: headerY - 35,
            size: 10,
            font: helveticaFont,
            color: darkGray,
        });
    }

    // Invoice title and details
    const invoiceHeaderY = height - 160;

    // Invoice title
    page.drawText("INVOICE", {
        x: width - 100,
        y: invoiceHeaderY,
        size: 20,
        font: helveticaBold,
        color: primaryColor,
    });

    // Invoice number and date
    page.drawText(`Invoice #: ${invoiceNumber}`, {
        x: width - 250,
        y: invoiceHeaderY - 30,
        size: 12,
        font: helveticaFont,
    });

    const currentDate = new Date().toLocaleDateString('en-GB');
    page.drawText(`Date: ${currentDate}`, {
        x: width - 250,
        y: invoiceHeaderY - 50,
        size: 12,
        font: helveticaFont,
    });

    // Client information section
    const clientSectionY = invoiceHeaderY - 100;

    // Section header
    page.drawRectangle({
        x: 50,
        y: clientSectionY + 10,
        width: width - 100,
        height: 25,
        color: lightGray,
    });

    page.drawText("Client Information", {
        x: 50,
        y: clientSectionY + 15,
        size: 12,
        font: helveticaBold,
        color: secondaryColor,
    });

    // Client details
    const clientDetails = [
        { label: "Email:", value: reservation.email },
        { label: "Payment Method:", value: reservation.paymentMethod },
        { label: "Status:", value: reservation.status || "Pending" },
    ];

    clientDetails.forEach((detail, index) => {
        const yPos = clientSectionY - 20 - (index * 25);

        page.drawText(detail.label, {
            x: 50,
            y: yPos,
            size: 10,
            font: helveticaFont,
            color: darkGray,
        });

        page.drawText(detail.value, {
            x: 250,
            y: yPos,
            size: 10,
            font: helveticaFont,
            color: secondaryColor,
        });
    });

    // Invoice items table
    const tableStartY = clientSectionY - 150;

    // Table header
    page.drawRectangle({
        x: 50,
        y: tableStartY + 10,
        width: width - 100,
        height: 25,
        color: primaryColor,
    });

    const tableHeaders = [
        { text: "Description", x: 60 },
        { text: "Amount", x: width - 120 }
    ];

    tableHeaders.forEach(header => {
        page.drawText(header.text, {
            x: header.x,
            y: tableStartY + 15,
            size: 12,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        });
    });

    // Table row
    page.drawRectangle({
        x: 50,
        y: tableStartY - 25,
        width: width - 100,
        height: 30,
        borderColor: lightGray,
        borderWidth: 1,
    });

    page.drawText("Reservation", {
        x: 60,
        y: tableStartY - 15,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
    });

    page.drawText(`${reservation.amount} SAR`, {
        x: width - 120,
        y: tableStartY - 15,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
    });

    // Total amount
    const totalY = tableStartY - 70;

    page.drawText("Total Amount:", {
        x: width - 250,
        y: totalY,
        size: 14,
        font: helveticaBold,
        color: secondaryColor,
    });

    page.drawText(`${reservation.amount} SAR`, {
        x: width - 120,
        y: totalY,
        size: 14,
        font: helveticaBold,
        color: accentColor,
    });

    // Footer
    const footerY = 50;

    page.drawLine({
        start: { x: 50, y: footerY + 20 },
        end: { x: width - 50, y: footerY + 20 },
        thickness: 1,
        color: lightGray,
    });

    page.drawText("Thank you for your business", {
        x: width / 2 - 80,
        y: footerY,
        size: 10,
        font: helveticaFont,
        color: darkGray,
    });

    // Convert to base64
    const pdfBytes = await pdfDoc.save();
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");

    return base64Pdf;
}