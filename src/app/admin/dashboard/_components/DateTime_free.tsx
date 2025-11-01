"use client";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ar } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";

type CalendarSlot = {
  date: string; // ISO date string or YYYY-MM-DD
  time_slot: string;
  status: "available" | "booked" | "closed";
};

interface AdminDateTimeEditorProps {
  calendarData: CalendarSlot[];
  setCalendarData: React.Dispatch<React.SetStateAction<CalendarSlot[]>>;
  changesMap: Record<string, Record<string, CalendarSlot["status"]>>;
  setChangesMap: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, CalendarSlot["status"]>>>
  >;
  handleSaveAll: () => void;
  saving: boolean;
}

export default function AdminDateTimeEditor({
  calendarData,
  setCalendarData,
  changesMap,
  setChangesMap,
  handleSaveAll,
  saving,
}: AdminDateTimeEditorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  // ✅ Compute which dates exist in the DB
  const availableDates = useMemo(() => {
    const s = new Set<string>();
    for (const r of calendarData) {
      const dateOnly = new Date(
        new Date(r.date).getTime() -
          new Date(r.date).getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];
      s.add(dateOnly);
    }
    return s;
  }, [calendarData]);

  // ✅ Time groups
  const timeGroups = [
    {
      label: " ",
      icon: <Moon className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
      times: [
        "12:00 ص - 12:15 ص",
        "12:30 ص - 12:45 ص",
        "01:00 ص - 01:15 ص",
        "02:00 ص - 02:15 ص",
        "02:30 ص - 02:45 ص",
        "03:00 ص - 03:15 ص",
        "04:00 ص - 04:15 ص",
        "04:30 ص - 04:45 ص",
        "05:00 ص - 05:15 ص",
        "06:00 ص - 06:15 ص",
        "06:30 ص - 06:45 ص",
        "07:00 ص - 07:15 ص",
      ],
    },
    {
      label: "",
      icon: <Sun className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
      times: [
        "08:00 ص - 08:15 ص",
        "08:30 ص - 08:45 ص",
        "09:00 ص - 09:15 ص",
        "10:00 ص - 10:15 ص",
        "10:30 ص - 10:45 ص",
        "11:00 ص - 11:15 ص",
        "12:00 م - 12:15 م",
        "12:30 م - 12:45 م",
        "01:00 م - 01:15 م",
        "02:00 م - 02:15 م",
        "02:30 م - 02:45 م",
        "03:00 م - 03:15 م",
      ],
    },
    {
      label: " ",
      icon: <Moon className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
      times: [
        "04:00 م - 04:15 م",
        "04:30 م - 04:45 م",
        "05:00 م - 05:15 م",
        "06:00 م - 06:15 م",
        "06:30 م - 06:45 م",
        "07:00 م - 07:15 م",
        "08:00 م - 08:15 م",
        "08:30 م - 08:45 م",
        "09:00 م - 09:15 م",
        "10:00 م - 10:15 م",
        "10:30 م - 10:45 م",
        "11:00 م - 11:15 م",
      ],
    },
  ];

  // ✅ Fetch from API
  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const res = await fetch("/api/get_freeTrial_calendar");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCalendarData(data.data);
        } else {
          console.error("Failed to load calendar:", data.error);
        }
      } catch (err) {
        console.error("Network error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [setCalendarData]);

  // ✅ Get slot status
  const getStatusFor = (
    dateISO: string,
    time: string
  ): CalendarSlot["status"] => {
    const localChanges = changesMap[dateISO];
    if (localChanges && localChanges[time]) return localChanges[time];

    const found = calendarData.find((s) => {
      const dbDate = new Date(s.date);
      const localDbDate = new Date(
        dbDate.getTime() - dbDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];
      return localDbDate === dateISO && s.time_slot.trim() === time.trim();
    });

    return found?.status ?? "closed";
  };

  // ✅ Toggle slot
  const toggleSlot = (dateISO: string, time: string) => {
    const current = getStatusFor(dateISO, time);
    if (current === "booked") return;

    const newStatus: CalendarSlot["status"] =
      current === "available" ? "closed" : "available";

    setChangesMap((prev) => {
      const next = { ...prev };
      if (!next[dateISO]) next[dateISO] = {};
      next[dateISO][time] = newStatus;
      return next;
    });
  };

  const selectedDateISO = selectedDate
    ? new Date(
        selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0]
    : "";

  return (
    <div className="bg-[#2D638A] mt-2 text-white px-4 py-2 rounded-t-2xl shadow-lg w-[50%] mx-auto">
      <h2 className="text-center text-sm font-semibold pb-2">
        التقويم / Calendar
      </h2>

      <div className="bg-[#A4D3DD] text-[#214E78] rounded-xl p-3 mb-4">
        <DayPicker
          locale={ar}
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          weekStartsOn={6}
          className="rdp1 custom-day-picker"
          modifiers={{
            hasSlots: (day) =>
              availableDates.has(
                new Date(day.getTime() - day.getTimezoneOffset() * 60000)
                  .toISOString()
                  .split("T")[0]
              ),
            disabled: { before: new Date() },
          }}
          modifiersStyles={{
            hasSlots: {
              backgroundColor: "#A4D3DD",
              color: "#214E78",
              borderRadius: "50%",
            },
          }}
          styles={{
            caption_label: {
              fontSize: "1rem",
              fontWeight: "700",
              color: "#214E78",
            },
            head: { color: "#214E78", fontWeight: "600" },
            day_selected: {
              backgroundColor: "#214E78",
              color: "#fff",
              padding: "7px",
            },
            day_disabled: {
              opacity: 0.4,
              pointerEvents: "none",
              textDecoration: "line-through",
            },
          }}
        />
      </div>

      {loading ? (
        <div className="text-center py-6 text-white text-sm">
          جاري تحميل المواعيد...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4  overflow-y-scroll">
            {timeGroups.map((group, gi) => (
              <div key={gi} className="flex flex-col items-center rounded-xl">
                <div className="flex text-[0.7em] flex-col pb-1 items-center mb-2 border-b">
                  {group.icon}
                  <span className="text-center text-[0.8em] font-bold mt-1">
                    {group.label}
                  </span>
                </div>

                <div
                  dir="ltr"
                  className="flex flex-col gap-2 w-full relative max-h-[10rem]"
                >
                  {group.times.map((time) => {
                    const dateISO = selectedDateISO;
                    const status = dateISO
                      ? getStatusFor(dateISO, time)
                      : "closed";

                    const isBooked = status === "booked";
                    const isAvailable = status === "available";
                    const isClosed = status === "closed";

                    return (
                      <div
                        dir="rtl"
                        key={time}
                        className="flex gap-3 items-center"
                      >
                        <span
                          className={` w-2 h-2 rounded-full ${
                            isBooked
                              ? "bg-[#CCCCCC]"
                              : isAvailable
                              ? "bg-[#A4D3DD]"
                              : "bg-white border border-[#214E78]"
                          }`}
                        />
                        <button
                          key={time}
                          className="relative w-[80%] py-1 rounded-lg text-[0.8em] font-semibold transition-all bg-[#A4D3DD]"
                          onClick={() => {
                            if (!dateISO) return alert("اختر تاريخاً أولاً");
                            toggleSlot(dateISO, time);
                          }}
                          disabled={isBooked}
                          type="button"
                        >
                          <div className="text-[10px] flex justify-center items-center text-[#214E78]">
                            {time}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
