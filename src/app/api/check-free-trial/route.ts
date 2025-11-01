import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

export async function POST(req: Request) {
    let connection;

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        // ✅ Connect to MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Check if email exists in free_trials table
        const [free] = await connection.query<RowDataPacket[]>(
            "SELECT email, status FROM free_trials WHERE email = ?",
            [email]
        );
        const [reservations] = await connection.query<RowDataPacket[]>(
            "SELECT email, status FROM reservations WHERE email = ? AND status = 'pending'",
            [email]
        );
        if (reservations.length > 0) {
            return NextResponse.json(
                { success: false, message: "Still pending Reservation" },
                { status: 403 }
            );
        }

        // ❌ No free trial found
        if (free.length === 0) {
            return NextResponse.json(
                { success: false, message: "No free trial found for this email" },
                { status: 404 }
            );
        }

        // ⚠️ If found but still pending
        const trial = free[0];
        if (trial.status === "pending") {
            return NextResponse.json(
                { success: false, message: "Still pending free trial" },
                { status: 409 }
            );
        }

        // ✅ Found and completed
        return NextResponse.json(
            { success: true, message: "Free trial found and completed" },
            { status: 200 }
        );

    } catch (err: unknown) {
        console.error("Error checking free trial:", err);
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
