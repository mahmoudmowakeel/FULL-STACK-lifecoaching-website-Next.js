import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

interface UpdateListeningOptionsBody {
  listen_status?: boolean;
  listen_text?: string;
  listen_price?: number;
  listen_meet_status?: boolean;
  listen_meet_text?: string;
  listen_meet_price?: number;
}

export async function POST(req: Request) {
  let connection;

  try {
    const body: UpdateListeningOptionsBody = await req.json();

    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    const query = `
      UPDATE listening_options
      SET
        listen_status = COALESCE(?, listen_status),
        listen_text = COALESCE(?, listen_text),
        listen_price = COALESCE(?, listen_price),
        listen_meet_status = COALESCE(?, listen_meet_status),
        listen_meet_text = COALESCE(?, listen_meet_text),
        listen_meet_price = COALESCE(?, listen_meet_price),
        updated_at = NOW()
      WHERE id = 1
    `;

    const values: (number | string | null)[] = [
      body.listen_status === undefined ? null : Number(body.listen_status),
      body.listen_text ?? null,
      body.listen_price ?? null,
      body.listen_meet_status === undefined ? null : Number(body.listen_meet_status),
      body.listen_meet_text ?? null,
      body.listen_meet_price ?? null,
    ];

    await connection.query(query, values);

    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    console.error("❌ Error updating listening options:", error);
    const errMsg =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ success: false, error: errMsg });
  } finally {
    if (connection) await connection.end();
  }
}
