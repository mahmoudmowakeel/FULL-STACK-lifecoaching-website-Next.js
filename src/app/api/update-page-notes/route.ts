import { NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

interface UpdatePageTextBody {
    type: "free_trials" | "reservations"; // The row to update
    text_ar?: string;
    text_en?: string;
}

export async function POST(req: Request) {
    let connection: mysql.Connection | null = null;

    try {
        const body: UpdatePageTextBody = await req.json();
        const { type, text_ar, text_en } = body;

        if (!type) {
            return NextResponse.json(
                { success: false, error: "Missing required field: type" },
                { status: 400 }
            );
        }

        // ✅ Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // ✅ Build dynamic SET fields
        const setFields: string[] = [];
        const values: (string | "free_trials" | "reservations")[] = [];

        if (text_ar !== undefined) {
            setFields.push("text_ar = ?");
            values.push(text_ar);
        }

        if (text_en !== undefined) {
            setFields.push("text_en = ?");
            values.push(text_en);
        }

        if (setFields.length === 0) {
            return NextResponse.json(
                { success: false, error: "No fields to update." },
                { status: 400 }
            );
        }

        // ✅ Add type as WHERE condition
        values.push(type);

        const query = `
      UPDATE page_texts
      SET ${setFields.join(", ")}
      WHERE type = ?
    `;

        const [result] = await connection.execute<ResultSetHeader>(query, values);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "No matching record found or no changes made." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "✅ Page text updated successfully.",
        });
    } catch (err) {
        console.error("❌ Error updating page text:", err);
        return NextResponse.json(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}
