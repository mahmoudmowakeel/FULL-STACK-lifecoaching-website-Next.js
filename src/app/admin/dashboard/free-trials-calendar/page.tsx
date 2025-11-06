"use client";
import { toast } from "sonner";
import ContentContainer from "../_UI/ContentContainer";
import AdminDateTimeEditor from "../_components/DateTime_free";
import { useState } from "react";

type CalendarSlot = {
  date: string; // ISO date string or YYYY-MM-DD
  time_slot: string;
  status: "available" | "booked" | "closed";
};

export default function CalendarFreeTrialsPage() {
  const [changesMap, setChangesMap] = useState<
    Record<string, Record<string, CalendarSlot["status"]>>
  >({});
  const [saving, setSaving] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarSlot[]>([]);

  const buildSavePayload = (): CalendarSlot[] => {
    const out: CalendarSlot[] = [];
    for (const dateISO of Object.keys(changesMap)) {
      for (const time of Object.keys(changesMap[dateISO])) {
        out.push({
          date: dateISO,
          time_slot: time,
          status: changesMap[dateISO][time],
        });
      }
    }
    return out;
  };

  const handleSaveAll = async () => {
    const payload = buildSavePayload();
    if (payload.length === 0) return alert("لا تغييرات للحفظ");

    try {
      setSaving(true);
      const res = await fetch("/api/update_freeTrial_calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: payload }),
      });
      const data = await res.json();

      if (data.success) {
        setCalendarData(data.data);
        setChangesMap({});
        alert("✅ تم الحفظ بنجاح");
      } else {
        console.error("Save failed:", data.error);
        alert("❌ فشل الحفظ: " + data.error);
      }
    } catch (err) {
      console.error("Network save error:", err);
      alert("❌ فشل الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  // ✅ New function to cancel changes
  const handleCancelAll = () => {
    if (Object.keys(changesMap).length === 0) {
      alert("لا توجد تغييرات لإلغائها");
      return;
    }
    setChangesMap({}); // discard unsaved edits
    toast.success("✅ تم إلغاء جميع التغييرات غير المحفوظة");
  };

  return (
    <div>
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="التجارب المجانيه التقويم / Free Trials Calendar"
      >
        <div>
          <AdminDateTimeEditor
            calendarData={calendarData}
            setCalendarData={setCalendarData}
            changesMap={changesMap}
            setChangesMap={setChangesMap}
            handleSaveAll={handleSaveAll}
            saving={saving}
          />

          <section className="text-[0.6rem] flex justify-between px-6 p-1 bg-white text-[#214E78] font-bold w-[50%] mx-auto rounded-b-2xl">
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 bg-[#FFFFFF] border border-[#214E78] rounded-full" />
              <p>مغلق</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 bg-[#A4D3DD] rounded-full" />
              <p>متاح</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 bg-[#CCCCCC] rounded-full" />
              <p>محجوز</p>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-center gap-2 w-[80%] mx-auto">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-1 rounded-3xl bg-[#214E78] text-white font-bold cursor-pointer"
            type="button"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ / Save"}
          </button>

          {/* ✅ Cancel button now discards all changes */}
          <button
            onClick={handleCancelAll}
            disabled={saving}
            className="px-6 py-1 rounded-3xl bg-white text-[#214E78] font-bold cursor-pointer"
            type="button"
          >
            الغاء / Cancel
          </button>
        </div>
      </ContentContainer>
    </div>
  );
}
