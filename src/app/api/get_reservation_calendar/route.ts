import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
    let connection;
    try {
        // ✅ Connect to your database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Fetch all records from reservation_calendar
        const [rows] = await connection.query(`
      SELECT id, date, time_slot, status, created_at
      FROM reservation_calendar
      ORDER BY date ASC, time_slot ASC;
    `);

        return NextResponse.json({
            success: true,
            count: Array.isArray(rows) ? rows.length : 0,
            data: rows,
        });
    } catch (err) {
        console.error("❌ Error fetching reservation calendar:", err);
        return NextResponse.json({
            success: false,
            error: String(err),
        });
    } finally {
        if (connection) await connection.end();
    }
}
