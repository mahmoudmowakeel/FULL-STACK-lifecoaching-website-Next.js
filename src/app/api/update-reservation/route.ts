import { NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

// Define expected request body
interface UpdateReservationBody {
  email: string;
  date_time?: string | null;
  status?: string;
  payment_bill?: string;
  paymentMethod?: string;
  type?: string;
  amount?: string;
  invoice_number?: string;
  invoice_pdf?: string;
  is_edited?: boolean; // ✅ new field
}

export async function POST(req: Request) {
  let connection: mysql.Connection | null = null;

  try {
    const body: UpdateReservationBody = await req.json();
    const {
      email,
      date_time,
      status,
      payment_bill,
      paymentMethod,
      type,
      amount,
      invoice_number,
      invoice_pdf,
      is_edited, // ✅ added
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing required field: email" },
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

    // ✅ Build the dynamic SQL update
    const setFields: string[] = [];
    const values: (string | number | null | boolean)[] = [];

    if (date_time) {
      setFields.push("date_time = ?");
      values.push(date_time);
    }
    if (status) {
      setFields.push("status = ?");
      values.push(status);
    }
    if (payment_bill) {
      setFields.push("payment_bill = ?");
      values.push(payment_bill);
    }
    if (paymentMethod) {
      setFields.push("paymentMethod = ?");
      values.push(paymentMethod);
    }
    if (type) {
      setFields.push("type = ?");
      values.push(type);
    }
    if (amount) {
      setFields.push("amount = ?");
      values.push(amount);
    }
    if (invoice_number) {
      setFields.push("invoice_number = ?");
      values.push(invoice_number);
    }
    if (invoice_pdf) {
      setFields.push("invoice_pdf = ?");
      values.push(invoice_pdf);
    }
    if (typeof is_edited === "boolean") {
      // ✅ Only update if the field is provided
      setFields.push("is_edited = ?");
      values.push(is_edited);
    }

    if (setFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 }
      );
    }

    // Add parameters for WHERE clause
    values.push(email);

    // ✅ Only update if current status = 'pending'
    const query = `
      UPDATE reservations
      SET ${setFields.join(", ")}
      WHERE email = ? AND status = 'pending';
    `;

    const [result] = await connection.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reservation not found, not pending, or no changes were made.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reservation updated successfully.",
    });
  } catch (err: unknown) {
    console.error("❌ Error updating reservation:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
