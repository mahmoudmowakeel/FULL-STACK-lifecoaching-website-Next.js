import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'mysql1003.site4now.net',
      user: 'abd56c_dbusers',
      password: '123anaana', // Replace with your actual password
      database: 'db_abd56c_dbusers',
    });

    // Query to get all tables in this database
    const [rows] = await connection.query('SHOW TABLES');

    return NextResponse.json({ success: true, tables: rows });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ success: false, error: err.message });
    } else {
      return NextResponse.json({ success: false, error: 'Unknown error' });
    }
  } finally {
    if (connection) await connection.end();
  }
}
