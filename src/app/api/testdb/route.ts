import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true, // 👈 allow multi-statements safely
      charset: "utf8mb4", // 👈 ensure emoji support
    });

    // ✅ Execute each command separately or with multipleStatements enabled
    await connection.query(`
      ALTER DATABASE ${process.env.DB_NAME} CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    `);

    await connection.query(`
      ALTER TABLE hiring_applications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    await connection.query(`
      ALTER TABLE hiring_applications 
      MODIFY message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    return NextResponse.json({
      success: true,
      message: "✅ Database and table successfully converted to utf8mb4",
    });
  } catch (err) {
    console.error("❌ Error converting to utf8mb4:", err);
    return NextResponse.json({ success: false, error: String(err) });
  } finally {
    if (connection) await connection.end();
  }
}
