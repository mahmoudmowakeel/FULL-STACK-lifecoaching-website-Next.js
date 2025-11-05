// Install: npm install jspdf jspdf-autotable amiri-font
// OR just use the first two packages for basic support

import { FreeTrial } from "@/app/admin/dashboard/free-trials/page";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Downloads table data as PDF with bilingual support
 * Arabic text will work but may not render perfectly without custom fonts
 * For production, consider adding Amiri or Cairo font
 */
export function downloadTableAsPDF(data: FreeTrial[], status?: string) {
    const doc = new jsPDF({
        orientation: "landscape", // Better for wide tables with Arabic
    });

    // Title - Bilingual
    doc.setFontSize(20);
    doc.setTextColor(33, 78, 120); // #214E78

    // Arabic title (right-aligned)
    doc.text("تقرير التجارب المجانية", doc.internal.pageSize.width - 14, 20, {
        align: "right"
    });

    // English title (left-aligned)
    doc.text("Free Trials Report", 14, 20);

    // Metadata
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);

    const today = new Date();
    const arabicDate = today.toLocaleDateString("ar-EG");
    const englishDate = today.toLocaleDateString("en-US");

    // Date info
    doc.text(`تاريخ: ${arabicDate}`, doc.internal.pageSize.width - 14, 28, { align: "right" });
    doc.text(`Date: ${englishDate}`, 14, 28);

    // Status info
    let yPos = 34;
    if (status) {
        const statusMap: { [key: string]: string } = {
            pending: "قيد الانتظار",
            completed: "مكتمل",
            cancelled: "ملغى"
        };
        const statusArabic = statusMap[status] || status;

        doc.text(`الحالة: ${statusArabic}`, doc.internal.pageSize.width - 14, yPos, { align: "right" });
        doc.text(`Status: ${status}`, 14, yPos);
        yPos += 6;
    }

    // Total records
    doc.text(`المجموع: ${data.length}`, doc.internal.pageSize.width - 14, yPos, { align: "right" });
    doc.text(`Total: ${data.length}`, 14, yPos);

    // Prepare table data
    const tableData = data.map((item, index) => {
        let formattedDateTime = "";
        if (item.date_time) {
            const date = new Date(item.date_time);
            // Format: YYYY-MM-DD HH:MM
            formattedDateTime = date.toISOString().slice(0, 16).replace("T", " ");
        }

        return [
            index + 1,
            item.name || "-",
            item.phone || "-",
            item.email || "-",
            formattedDateTime || "-",
        ];
    });

    // Generate table
    autoTable(doc, {
        startY: yPos + 10,
        head: [[
            "#",
            "الاسم / Name",
            "الهاتف / Phone",
            "البريد الإلكتروني / Email",
            "التاريخ والوقت / Date & Time"
        ]],
        body: tableData,

        // Styling
        styles: {
            fontSize: 10,
            cellPadding: 4,
            overflow: "linebreak",
            halign: "center",
            valign: "middle",
            lineColor: [164, 211, 221],
            lineWidth: 0.5,
        },

        // Header styling
        headStyles: {
            fillColor: [164, 211, 221], // #A4D3DD
            textColor: [33, 78, 120], // #214E78
            fontStyle: "bold",
            fontSize: 10,
            halign: "center",
            minCellHeight: 12,
        },

        // Body styling
        bodyStyles: {
            textColor: [33, 78, 120],
            fontSize: 9,
        },

        // Alternate row colors
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },

        // Column widths
        columnStyles: {
            0: { cellWidth: 20, halign: "center" }, // #
            1: { cellWidth: 50, halign: "left" },   // Name
            2: { cellWidth: 45, halign: "center" }, // Phone
            3: { cellWidth: 70, halign: "left" },   // Email
            4: { cellWidth: 50, halign: "center" }, // Date & Time
        },

        // Table positioning
        margin: { top: 10, left: 14, right: 14 },

        // Add page numbers
        didDrawPage: function (data) {
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            const pageCount = doc.getNumberOfPages();
            const currentPage = doc.getCurrentPageInfo().pageNumber;
            doc.text(
                `صفحة ${currentPage} من ${pageCount}`,
                doc.internal.pageSize.width - 14,
                doc.internal.pageSize.height - 10,
                { align: "right" }
            );
            doc.text(
                `Page ${currentPage} of ${pageCount}`,
                14,
                doc.internal.pageSize.height - 10
            );
        },
    });

    // Save with Arabic-friendly filename
    const timestamp = today.getTime();
    const statusText = status ? `-${status}` : "";
    const fileName = `free-trials${statusText}-${timestamp}.pdf`;

    doc.save(fileName);
}

// Export ready-to-use function
export default downloadTableAsPDF;