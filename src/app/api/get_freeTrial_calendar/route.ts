import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
    let connection;

    try {
        // ✅ Connect to your existing database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Query all data
        const [rows] = await connection.query("SELECT * FROM free_trial_calendar ORDER BY date, time_slot");

        // ✅ Log to server console (useful in your Vercel or local logs)
        console.log("📅 free_trial_calendar data:", rows);

        // ✅ Return as JSON to browser
        return NextResponse.json({
            success: true,
            count: Array.isArray(rows) ? rows.length : 0,
            data: rows,
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("❌ MySQL Error:", err.message);
            return NextResponse.json({ success: false, error: err.message });
        } else {
            return NextResponse.json({ success: false, error: "Unknown error" });
        }
    } finally {
        if (connection) await connection.end();
    }
}
