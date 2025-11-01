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

    const [rows] = await connection.query("SELECT * FROM hiring_applications ORDER BY created_at DESC");

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    return NextResponse.json({ success: false, error: String(err) });
  } finally {
    if (connection) await connection.end();
  }
}
