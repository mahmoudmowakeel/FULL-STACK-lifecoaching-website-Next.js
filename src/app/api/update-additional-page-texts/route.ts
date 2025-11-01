import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();

    // ✅ Support both single object and array of updates
    const updates = Array.isArray(body) ? body : [body];

    if (!updates.length) {
      return NextResponse.json({
        success: false,
        error: "No updates provided.",
      });
    }

    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    // ✅ Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS additional_page_texts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) UNIQUE NOT NULL,
        text_ar TEXT,
        text_en TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ Insert or update each entry
    for (const entry of updates) {
      if (!entry.type) continue;

      await connection.query(
        `
        INSERT INTO additional_page_texts (type, text_ar, text_en)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          text_ar = VALUES(text_ar),
          text_en = VALUES(text_en)
      `,
        [entry.type, entry.text_ar || "", entry.text_en || ""]
      );
    }

    return NextResponse.json({
      success: true,
      message: "✅ Records inserted or updated successfully.",
    });
  } catch (err) {
    console.error("❌ Error updating additional_page_texts:", err);
    return NextResponse.json({ success: false, error: String(err) });
  } finally {
    if (connection) await connection.end();
  }
}
