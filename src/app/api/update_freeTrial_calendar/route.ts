import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

type CalendarSlot = {
  date: string; // ISO or "YYYY-MM-DD"
  time_slot: string;
  status: "available" | "booked" | "closed";
};

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

export async function GET() {
  let conn = null;
  try {
    conn = await getConnection();

    // 🧹 Remove all past dates
    await conn.execute(`DELETE FROM free_trial_calendar WHERE DATE(date) < CURDATE()`);

    // 📦 Fetch remaining
    const [rows] = await conn.query(
      `SELECT id, date, time_slot, status 
       FROM free_trial_calendar 
       ORDER BY date ASC, time_slot ASC`
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

    // 🧹 1. Clean up past dates
    await conn.execute(`DELETE FROM free_trial_calendar WHERE DATE(date) < CURDATE()`);

    // 🧹 2. Delete duplicates before inserting new ones
    for (const slot of slots) {
      const dateOnly =
        slot.date.includes("T") || slot.date.includes(" ")
          ? slot.date
          : `${slot.date} 00:00:00`;

      // ❌ Delete any existing record for same date & time_slot
      await conn.execute(
        `DELETE FROM free_trial_calendar WHERE DATE(date) = DATE(?) AND time_slot = ?`,
        [dateOnly, slot.time_slot]
      );

      // ✅ Insert new record
      await conn.execute(
        `INSERT INTO free_trial_calendar (date, time_slot, status, created_at)
         VALUES (?, ?, ?, NOW())`,
        [dateOnly, slot.time_slot, slot.status]
      );
    }

    // ✅ 3. Return updated records
    const [rows] = await conn.query(
      `SELECT id, date, time_slot, status 
       FROM free_trial_calendar 
       ORDER BY date ASC, time_slot ASC`
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
