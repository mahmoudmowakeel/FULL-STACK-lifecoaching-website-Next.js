import { NextResponse } from "next/server";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";

interface AdminBody {
  email: string;
}

export async function POST(req: Request) {
  let connection: mysql.Connection | null = null;

  try {
    const body: AdminBody = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email field" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    // Check if already exists
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Admin already exists" },
        { status: 409 }
      );
    }

    // Insert new admin
    await connection.execute<ResultSetHeader>(
      "INSERT INTO admins (email) VALUES (?)",
      [email]
    );

    return NextResponse.json(
      { success: true, message: "Admin created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
