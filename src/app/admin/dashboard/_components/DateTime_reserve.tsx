"use client";
import {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { DayPicker } from "react-day-picker";
import { ar } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";
import { toast } from "sonner";

type CalendarSlot = {
  date: string;
  time_slot: string;
  status: "available" | "booked" | "closed";
};

export type AdminDateTimeEditorReserveRef = {
  handleSaveAll: () => void;
  resetChanges: () => void;
  saving: boolean;
};

const AdminDateTimeEditorReserve = forwardRef<AdminDateTimeEditorReserveRef>(
  (_, ref) => {
    const [calendarData, setCalendarData] = useState<CalendarSlot[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changesMap, setChangesMap] = useState<
      Record<string, Record<string, CalendarSlot["status"]>>
    >({});

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

    const timeGroups = [
      {
        label: "المساء / Evening",
        icon: <Moon className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
        times: [
          "04:00 م - 05:30 م",
          "06:00 م - 07:30 م",
          "08:00 م - 09:30 م",
          "10:00 م - 11:30 م",
        ],
      },
      {
        label: "الصباح / Morning",
        icon: <Sun className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
        times: [
          "08:00 ص - 09:30 ص",
          "10:00 ص - 11:30 ص",
          "12:00 م - 01:30 م",
          "02:00 م - 03:30 م",
        ],
      },
      {
        label: "الفجر / Dawn",
        icon: <Moon className="text-[#A4D3DD] w-3 h-3 mx-auto" />,
        times: [
          "12:00 ص - 01:30 ص",
          "02:00 ص - 03:30 ص",
          "04:00 ص - 05:30 ص",
          "06:00 ص - 07:30 ص",
        ],
      },
    ];

    useEffect(() => {
      async function loadCalendar() {
        setLoading(true);
        try {
          const res = await fetch("/api/get_reservation_calendar");
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
    }, []);

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
        const res = await fetch("/api/update_reservation_calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: payload }),
        });
        const data = await res.json();

        if (data.success) {
          setCalendarData(data.data);
          setChangesMap({});
          toast.success("تم حفظ التغييرات بنجاح.")
        } else {
          console.error("Save failed:", data.error);
          toast.error("فشل في حفظ التغييرات , برجاء اعادة المجاوله.")
        }
      } catch (err) {
        console.error("Network save error:", err);
        toast.error("❌ فشل الاتصال بالخادم");
      } finally {
        setSaving(false);
      }
    };

    const resetChanges = () => setChangesMap({});

    useImperativeHandle(ref, () => ({
      handleSaveAll,
      resetChanges,
      saving,
    }));

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
          <div className="grid md:grid-cols-3 gap-4">
            {timeGroups.map((group, gi) => (
              <div key={gi} className="flex flex-col items-center rounded-xl">
                <div className="flex text-[0.7em] flex-col pb-1 items-center mb-2 border-b">
                  {group.icon}
                  <span className="text-center text-[0.8em] font-bold mt-1">
                    {group.label}
                  </span>
                </div>

                <div className="flex flex-col gap-2 w-full relative">
                  {group.times.map((time) => {
                    const dateISO = selectedDateISO;
                    const status = dateISO
                      ? getStatusFor(dateISO, time)
                      : "closed";

                    const isBooked = status === "booked";
                    const isAvailable = status === "available";

                    return (
                      <div key={time} className="flex gap-3 items-center">
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
                          className="relative w-[80%] py-1 rounded-lg text-[0.8em] font-semibold transition-all bg-[#A4D3DD]"
                          onClick={() => {
                            if (!dateISO) return toast.warning("اختر تاريخاً أولاً");
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
        )}
      </div>
    );
  }
);
AdminDateTimeEditorReserve.displayName = "AdminDateTimeEditorReserve";

export default AdminDateTimeEditorReserve;
