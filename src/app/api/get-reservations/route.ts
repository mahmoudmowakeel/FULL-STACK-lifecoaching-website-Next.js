import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

export async function GET() {
  let connection;

  try {
    // ✅ Connect to MySQL
    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    // ✅ Query: join reservations with free_trials by email
    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT 
        r.id,
        r.email,
        ft.name,
        ft.phone,
        r.date_time,
        r.status,
        r.payment_bill,
        r.paymentMethod,
        r.type,
        r.amount,
        r.is_edited,
        r.invoice_number,
        r.invoice_pdf,
        r.created_at
      FROM reservations AS r
      LEFT JOIN free_trials AS ft ON r.email = ft.email
      ORDER BY r.created_at DESC;
    `);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (err: unknown) {
    console.error("❌ Error fetching reservations:", err);

    if (err instanceof Error) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
