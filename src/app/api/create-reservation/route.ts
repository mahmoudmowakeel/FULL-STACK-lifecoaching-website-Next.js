import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";

/* ------------------ INTERFACES ------------------ */
interface ReservationFormData {
    email: string;
    date_time?: string | null; // e.g. "2025-10-31 02:00"
    status?: string;
    payment_bill: string;
    paymentMethod: string;
    type: string;
    amount: string;
}

interface InvoiceOptions {
    companyLogo?: Buffer | Uint8Array;
    companyName?: string;
    companyAddress?: string;
    companyTaxNumber?: string;
}

/* ------------------ LOAD COMPANY LOGO ------------------ */
async function loadLogo(): Promise<Buffer | null> {
    try {
        const fs = await import("fs");
        const path = await import("path");

        const possiblePaths = [
            path.join(process.cwd(), "public", "logo.png"),
            path.join(process.cwd(), "public", "logo.jpg"),
            path.join(process.cwd(), "public", "logo.jpeg"),
        ];

        for (const logoPath of possiblePaths) {
            if (fs.existsSync(logoPath)) {
                console.log("Found logo at:", logoPath);
                return fs.readFileSync(logoPath);
            }
        }

        console.warn("⚠️ Logo not found in common locations");
        return null;
    } catch (error) {
        console.error("Error loading logo:", error);
        return null;
    }
}

/* ------------------ MAIN HANDLER ------------------ */
export async function POST(req: Request) {
    let connection;

    try {
        const formData: ReservationFormData = await req.json();
        const { email, date_time, status, payment_bill, paymentMethod, type, amount } =
            formData;

        // ✅ Validate required fields
        if (!email || !payment_bill || !paymentMethod || !type || !amount) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Prevent duplicate pending reservations
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT email FROM reservations WHERE email = ? AND status = 'pending'",
            [email]
        );

        // if (rows.length > 0) {
        //     return NextResponse.json(
        //         { success: false, message: "Email already has a pending reservation" },
        //         { status: 409 }
        //     );
        // }

        // ✅ Create invoice number (YYYY-MM-DD-000001 format)
        const today = new Date().toISOString().split("T")[0];
        const [countRows] = await connection.query<RowDataPacket[]>(
            "SELECT COUNT(*) AS count FROM reservations WHERE DATE(created_at) = CURDATE()"
        );
        const count = countRows[0].count + 1;
        const invoiceNumber = `${today}-${count.toString().padStart(6, "0")}`;

        // ✅ Invoice Options (Arabic support)
        const invoiceOptions: InvoiceOptions = {
            companyName: "Istifham Company",
            companyAddress: "",
            companyTaxNumber: "",
        };

        const companyLogo = await loadLogo();
        if (companyLogo) invoiceOptions.companyLogo = companyLogo;

        // ✅ Generate PDF
        const reservationForPDF: ReservationFormData = {
            email,
            payment_bill,
            paymentMethod,
            type,
            amount,
            date_time: date_time || null,
            status: status || "pending",
        };

        const invoicePDF = await generateInvoicePDF(
            reservationForPDF,
            invoiceNumber,
            invoiceOptions
        );

        // ✅ Insert with plain "YYYY-MM-DD HH:mm" — no UTC conversion
        await connection.query(
            `
      INSERT INTO reservations 
        (invoice_number, invoice_pdf, email, date_time, status, payment_bill, paymentMethod, type, amount)
      VALUES 
        (?, ?, ?, STR_TO_DATE(?, '%Y-%m-%d %H:%i'), ?, ?, ?, ?, ?)
      `,
            [
                invoiceNumber,
                invoicePDF,
                email,
                date_time || null,
                status || "pending",
                payment_bill,
                paymentMethod,
                type,
                amount,
            ]
        );

        return NextResponse.json(
            {
                success: true,
                message: "Reservation created successfully",
                invoiceNumber,
                invoice_pdf: Buffer.from(invoicePDF).toString("base64"), // ✅ safe
            },
            { status: 200 }
        );
    } catch (err: unknown) {
        console.error("❌ Error creating reservation:", err);
        if (err instanceof Error) {
            return NextResponse.json(
                { success: false, error: err.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { success: false, error: "Unknown error" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}
