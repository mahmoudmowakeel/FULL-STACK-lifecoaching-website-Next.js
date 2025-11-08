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
    INSERT INTO additional_page_texts (type, text_ar, text_en, created_at, updated_at)
VALUES (
  'edit-reserve',
 "تعديل الحجز سوف يكون لمره واحده فقط لذلك يرجى التأكد من انك سوف تتمكن من الحضور قبل اجراء التعديل والا فلن تتمكن من الاستفاده من هذا الحجز مره اخرى. ",
  "The booking can only be modified once, so please make sure that you will be able to attend before making the modification, otherwise you will not be able to benefit from this booking again.",
  NOW(),
  NOW()
);
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
