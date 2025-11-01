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

    // ✅ Fetch all records, ordered by creation date
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM free_trials ORDER BY date_time DESC"
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (err: unknown) {
    console.error("❌ Error fetching free trials:", err);

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
