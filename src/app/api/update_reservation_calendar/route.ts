import { NextResponse } from "next/server";
import mysql, { ResultSetHeader } from "mysql2/promise";

type CalendarSlot = {
    date: string; // "YYYY-MM-DD" or ISO
    time_slot: string;
    status: "available" | "booked" | "closed";
};

const DB_CONFIG = {
    host: "mysql1003.site4now.net",
    user: "abd56c_dbusers",
    password: "123anaana",
    database: "db_abd56c_dbusers",
};

async function getConnection() {
    return await mysql.createConnection(DB_CONFIG);
}

export async function GET() {
    let conn = null;
    try {
        conn = await getConnection();

        // 🧹 Delete past records
        await conn.execute(`DELETE FROM reservation_calendar WHERE DATE(date) < CURDATE()`);

        // 📦 Return remaining
        const [rows] = await conn.query(
            `SELECT id, date, time_slot, status FROM reservation_calendar ORDER BY date ASC, time_slot ASC`
        );

        return NextResponse.json({ success: true, data: rows });
    } catch (err) {
        console.error("GET calendar error:", err);
        return NextResponse.json(
            { success: false, error: (err instanceof Error && err.message) || "Unknown" },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}

export async function POST(req: Request) {
    let conn = null;
    try {
        const body = await req.json();
        if (!body || !Array.isArray(body.slots)) {
            return NextResponse.json(
                { success: false, error: "Invalid payload" },
                { status: 400 }
            );
        }
        const slots: CalendarSlot[] = body.slots;

        conn = await getConnection();

        // 🧹 Clean past days
        await conn.execute(`DELETE FROM reservation_calendar WHERE DATE(date) < CURDATE()`);

        // 🧹 Also clear duplicates before each insert
        for (const slot of slots) {
            // Extract clean date (it's already in correct format "2025-11-02")
            const dateOnly = slot.date; // "2025-11-02"

            // ❌ Delete any old record with same date + time_slot
            await conn.execute(
                `DELETE FROM reservation_calendar 
     WHERE DATE(date) = ? AND time_slot = ?`,
                [dateOnly, slot.time_slot]
            );

            // ✅ Insert new slot
            await conn.execute(
                `INSERT INTO reservation_calendar (date, time_slot, status, created_at)
     VALUES (?, ?, ?, NOW())`,
                [dateOnly, slot.time_slot, slot.status]
            );
        }

        // ✅ Return updated list
        const [rows] = await conn.query(
            `SELECT id, date, time_slot, status FROM reservation_calendar ORDER BY date ASC, time_slot ASC`
        );

        return NextResponse.json({ success: true, data: rows });
    } catch (err) {
        console.error("POST calendar error:", err);
        return NextResponse.json(
            { success: false, error: (err instanceof Error && err.message) || "Unknown" },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
