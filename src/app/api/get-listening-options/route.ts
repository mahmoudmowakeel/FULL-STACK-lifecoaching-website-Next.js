import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

interface ListeningOptionsRow extends RowDataPacket {
    id: number;
    listen_status: number;
    listen_text: string;
    listen_price: number;
    listen_meet_status: number;
    listen_meet_text: string;
    listen_meet_price: number;
}

export async function GET() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.query<ListeningOptionsRow[]>(
            "SELECT * FROM listening_options LIMIT 1"
        );

        const data = rows.length > 0 ? rows[0] : null;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("❌ Error fetching listening options:", error);
        const errMsg =
            error instanceof Error ? error.message : "Unknown server error";
        return NextResponse.json({ success: false, error: errMsg });
    } finally {
        if (connection) await connection.end();
    }
}
