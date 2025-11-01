import { NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

interface UpdateFreeTrialBody {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  date_time?: string | null;
  status?: string;
}

export async function POST(req: Request) {
  let connection: mysql.Connection | null = null;

  try {
    const body: UpdateFreeTrialBody = await req.json();
    const { id, name, phone, email, date_time, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // ✅ Connect to MySQL
    connection = await mysql.createConnection({
       host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
    });

    // ✅ Dynamically build the update query
    const setFields: string[] = [];
    const values: (string | number | null)[] = [];

    if (typeof name !== "undefined") {
      setFields.push("name = ?");
      values.push(name);
    }

    if (typeof phone !== "undefined") {
      setFields.push("phone = ?");
      values.push(phone);
    }

    if (typeof email !== "undefined") {
      setFields.push("email = ?");
      values.push(email);
    }

    // ✅ Only update date_time if it’s explicitly included in the request
    if (body.hasOwnProperty("date_time")) {
      setFields.push("date_time = ?");
      values.push(date_time!);
    }

    if (typeof status !== "undefined") {
      setFields.push("status = ?");
      values.push(status);
    }

    // ✅ No fields to update
    if (setFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    // ✅ Add WHERE id
    values.push(id);

    const query = `
      UPDATE free_trials
      SET ${setFields.join(", ")}
      WHERE id = ?`;

    const [result] = await connection.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found or no changes made" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Record updated successfully",
    });
  } catch (err) {
    console.error("❌ Error updating free trial:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
