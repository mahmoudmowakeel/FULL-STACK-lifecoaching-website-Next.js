import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface FreeTrial {
  name: string;
  phone: string;
  email: string;
  date_time?: string | null;
  status?: string;
}

export async function POST(req: Request) {
  let connection;

  try {
    const formData: FreeTrial = await req.json();
    const { name, phone, email, date_time, status } = formData;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // ✅ Properly type the result of the query
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT email, phone FROM free_trials WHERE email = ? OR phone = ?",
      [email, phone]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    await connection.query(
      `INSERT INTO free_trials (name, phone, email, date_time, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email, date_time || null, status || 'pending']
    );

    return NextResponse.json(
      { success: true, message: 'Record inserted successfully' },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
