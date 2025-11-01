import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface FreeTrial {
  email: string;
}

interface FreeTrialRow extends RowDataPacket {
  email: string;
  status: string;
}

interface UserRow extends RowDataPacket {
  email: string;
  name: string;
  phone: string;
  status: string;
}

export async function POST(req: Request) {
  let connection;

  try {
    const { email }: FreeTrial = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    // ✅ Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // ✅ Check if email exists
    const [rows] = await connection.query<FreeTrialRow[]>(
      'SELECT email, status FROM free_trials WHERE email = ?',
      [email]
    );

    // Case 1: Email does not exist
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email not found.' },
        { status: 404 }
      );
    }

    // Case 2: Exists but pending
    const existing = rows[0];
    if (existing.status === 'pending') {
      return NextResponse.json(
        { success: true, message: 'Account found but still pending verification.' },
        { status: 200 }
      );
    }

    // Case 3: Exists and done - Fetch additional user details
    if (existing.status === 'completed') {
      const [userDetails] = await connection.query<UserRow[]>(
        'SELECT email, name, phone FROM free_trials WHERE email = ?',
        [email]
      );

      if (userDetails.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User details not found.' },
          { status: 404 }
        );
      }

      // Returning user data upon successful login
      const user = userDetails[0];
      return NextResponse.json(
        { success: true, message: 'Login successful.', user: user },
        { status: 200 }
      );
    }

    // Optional catch-all for other statuses
    return NextResponse.json(
      { success: false, message: `Unexpected status: ${existing.status}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
