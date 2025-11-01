import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  let connection;

  try {
    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    const [rows] = await connection.query("SELECT * FROM hiring_status LIMIT 1");

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, hiringOpen: false });
    }

    const { hiringOpen } = rows[0] as { hiringOpen: number }; // 1 or 0 in MySQL
    const { hiring_text } = rows[0] as { hiring_text: string }; // 1 or 0 in MySQL
    return NextResponse.json({
      success: true,
      hiringOpen: !!hiringOpen,
      hiring_text
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching hiring status:", error);
    return NextResponse.json({ success: false, hiringOpen: false });
  }
}
