import { NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

interface ManageHiringBody {
  action: "update" | "delete";
  id: number;
  // Optional fields if updating
  status?: string;
  name?: string;
  phone?: string;
  email?: string;
  date_time?: string | null;
}

export async function POST(req: Request) {
  let connection: mysql.Connection | null = null;

  try {
    const body: ManageHiringBody = await req.json();
    const { action, id, status, name, phone, email, date_time } = body;

    if (!action || !id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: action or id" },
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

    let query = "";
    let values: (string | number | null)[] = [];

    if (action === "delete") {
      // 🗑️ Delete record
      query = "DELETE FROM hiring_applications WHERE id = ?";
      values = [id];
    } else if (action === "update") {
      const setFields: string[] = [];

      if (status !== undefined) {
        setFields.push("`status` = ?");
        values.push(status);
      }
      if (name !== undefined) {
        setFields.push("name = ?");
        values.push(name);
      }
      if (phone !== undefined) {
        setFields.push("phone = ?");
        values.push(phone);
      }
      if (email !== undefined) {
        setFields.push("email = ?");
        values.push(email);
      }
      if (date_time !== undefined) {
        setFields.push("date_time = ?");
        values.push(date_time);
      }

      if (setFields.length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields provided to update" },
          { status: 400 }
        );
      }

      query = `UPDATE hiring_applications SET ${setFields.join(", ")} WHERE id = ?`;
      values.push(id);

      console.log("🔍 Query:", query, values);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action type" },
        { status: 400 }
      );
    }

    // ✅ Execute query
    const [result] = await connection.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "No record affected — check ID or data" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "delete"
          ? "Record deleted successfully"
          : "Record updated successfully",
    });
  } catch (err) {
    console.error("❌ Error managing hiring application:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
