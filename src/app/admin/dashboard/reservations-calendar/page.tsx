"use client";
import { useRef } from "react";
import ContentContainer from "../_UI/ContentContainer";
import AdminDateTimeEditorReserve, {
  AdminDateTimeEditorReserveRef,
} from "../_components/DateTime_reserve";

export default function CalendarReservationsPage() {
  const calendarRef = useRef<AdminDateTimeEditorReserveRef>(null);

  const handleSave = () => {
    calendarRef.current?.handleSaveAll();
  };

  const handleReset = () => {
    calendarRef.current?.resetChanges();
  };

  const saving = calendarRef.current?.saving;

  return (
    <div>
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="الحجوزات - التقويم / Reservations - Calendar"
      >
        <div>
          <AdminDateTimeEditorReserve ref={calendarRef} />

          {/* Legend */}
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
          {/* Buttons */}
          <div className="mt-6 flex justify-center gap-2 w-[50%] mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-1 rounded-3xl bg-[#214E78] text-white font-bold cursor-pointer"
              type="button"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ / Save"}
            </button>
            {/* ✅ Cancel button now discards all changes */}
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-1 rounded-3xl bg-white text-[#214E78] font-bold cursor-pointer"
              type="button"
            >
              تراجع / Cancel
            </button>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}
