import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(request: Request) {
    let connection;

    try {
        const { name, phone, email, message } = await request.json();

        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: "Name and email are required." },
                { status: 400 }
            );
        }

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await connection.query(
            `INSERT INTO hiring_applications (name, phone, email, message)
       VALUES (?, ?, ?, ?)`,
            [name, phone, email, message]
        );

        return NextResponse.json({
            success: true,
            message: "Application submitted successfully!",
        });
    } catch (err) {
        console.error("❌ Error adding application:", err);
        return NextResponse.json(
            { success: false, error: String(err) },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}
