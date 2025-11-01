import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

interface CheckAdminBody {
    email: string;
}

export async function POST(req: Request) {
    let connection: mysql.Connection | null = null;

    try {
        const body: CheckAdminBody = await req.json();
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
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );

        if (rows.length > 0) {
            return NextResponse.json({ success: true, isAdmin: true });
        } else {
            return NextResponse.json({ success: true, isAdmin: false });
        }
    } catch (err) {
        console.error("❌ Error checking admin:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}
