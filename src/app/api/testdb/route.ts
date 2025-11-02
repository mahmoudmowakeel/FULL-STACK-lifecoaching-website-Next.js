import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST() {
  let connection;

  try {
    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    // ✅ Ensure table exists
    const date = await connection.query(`
TRUNCATE TABLE free_trials;

    `);

    return NextResponse.json({
      success: true,
      message: "✅ admin Inserterd created",
      data: date
    });
  } catch (err) {
    console.error("❌ Error initializing final_page_texts:", err);
    return NextResponse.json({ success: false, error: String(err) });
  } finally {
    if (connection) await connection.end();
  }
}
