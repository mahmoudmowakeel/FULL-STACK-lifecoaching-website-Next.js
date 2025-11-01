import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
    let connection;

    try {
        const body = await req.json();
        const { hiringOpen, hiring_text } = body;

        // 🧩 Validate inputs
        if (typeof hiringOpen !== "boolean" || typeof hiring_text !== "string") {
            return NextResponse.json(
                { success: false, message: "Invalid input data." },
                { status: 400 }
            );
        }

        // 🔗 Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Update record
        await connection.query(
            "UPDATE hiring_status SET hiringOpen = ?, hiring_text = ? LIMIT 1",
            [hiringOpen, hiring_text]
        );

        return NextResponse.json({
            success: true,
            hiringOpen,
            hiring_text,
            message: `Hiring status updated to ${hiringOpen ? "OPEN ✅" : "CLOSED 🚫"}`,
        });
    } catch (err) {
        console.error("❌ Error updating hiring status:", err);
        return NextResponse.json(
            { success: false, error: "Database error" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}
