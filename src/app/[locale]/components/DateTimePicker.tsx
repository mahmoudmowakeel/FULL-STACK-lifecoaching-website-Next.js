"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ar } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";
import { FreeTrialFormData, ReservationFormData } from "@/lib/types/freeTrials";
import { useLocale } from "next-intl";

import { json } from "stream/consumers";

type FormTypes = FreeTrialFormData | ReservationFormData;

interface CalendarSlot {
  date: string;
  time_slot: string;
  status: "available" | "booked" | "closed";
}

interface DateTimePickerProps<T extends FormTypes> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  type: string;

  // Correct union type for selectedDate
  selectedDate: Date | undefined;
  // setSelectedDate should update only the selectedDate
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;

  selectedTime: string;
  // setSelectedTime should update only the selectedTime
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
}

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function DateTimePicker<T extends FormTypes>({
  formData,
  setFormData,
  type,
  selectedDate,
  selectedTime,
  setSelectedDate,
  setSelectedTime,
}: DateTimePickerProps<T>) {
  const [calendarData, setCalendarData] = useState<CalendarSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [isAllClosed, setIsAllClosed] = useState(false);
  const [notes, setNotes] = useState<{
    no_dates: string;
  }>();
  const locale = useLocale();

  // ✅ Fetch calendar data from API
  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/get_freeTrial_calendar");
        const data = await res.json();
        if (data.success) {
          setCalendarData(data.data);

          // ✅ convert to local date (YYYY-MM-DD)
          const localDates = data.data.map((d: CalendarSlot) =>
            new Date(d.date).toLocaleDateString("en-CA")
          );
          setAvailableDates(new Set(localDates));

          const hasAvailable = data.data.some(
            (d: CalendarSlot) => d.status === "available"
          );
          setIsAllClosed(!hasAvailable);
        }
      } catch (err) {
        console.error("Failed to load calendar:", err);
      }
    }
    async function getNotes() {
      try {
        const response = await fetch("/api/get-additional-page-texts");
        const data = await response.json();

        if (!data.success) return false;
        const no_dates = data.data.find(
          (el: ElementType) => el.type == "no_dates"
        );

        setNotes({
          no_dates: locale == "ar" ? no_dates?.text_ar : no_dates?.text_en,
        });
      } catch (error) {
        return false;
      }
    }

    getNotes();
    fetchCalendar();
  }, []);

  // ✅ Update selected date in formData
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    // Convert Arabic AM/PM time format to 24-hour English format
    const timeParts = selectedTime
      .replace("ص", "AM")
      .replace("م", "PM")
      .split(" - ")[0]
      .trim(); // take the start of the slot ("08:00 ص")

    // Combine date + time into one local datetime string
    const [hours, minutes] = timeParts
      .replace("AM", "")
      .replace("PM", "")
      .split(":")
      .map(Number);

    const isPM = selectedTime.includes("م");
    const adjustedHours =
      isPM && hours < 12 ? hours + 12 : !isPM && hours === 12 ? 0 : hours;

    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(adjustedHours, minutes, 0, 0);

    setFormData(
      (prev) =>
        ({
          ...(prev as unknown as object),
          date_time: combinedDateTime.toLocaleString("sv-SE").replace(" ", "T"),
        } as T)
    );
  }, [selectedDate, selectedTime, setFormData]);

  // ✅ Time groups remain as is
  const timeGroups = [
    {
      label: "",
      icon: (
        <div className="relative  mx-auto flex gap-3">
          <Sun className="text-[#A4D3DD] w-3 h-3 " />
          <Moon className="text-[#A4D3DD] w- h-3 " />
        </div>
      ),
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
      label: "",
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

  // ✅ Disable any day not in DB
  // ✅ Disable any day not in DB + disable today
  const disabledDays = (day: Date) => {
    const localDate = day.toLocaleDateString("en-CA");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only

    const isToday = day.toDateString() === today.toDateString();

    return !availableDates.has(localDate) || isToday;
  };
  return (
    <>
      {isAllClosed ? (
        <div className="text-[#214E78] text-2xl text-center">
          {notes?.no_dates}
        </div>
      ) : (
        <>
          <div className="bg-[#2D638A] mt-[-10px] text-white px-4 py-2 rounded-t-2xl shadow-lg w-[90%] md:w-[70%] mx-auto">
            {/* === Calendar Section === */}
            <h2 className="text-center text-xs font-semibold pb-2">
              التقويم / Calendar
            </h2>
            <div className="bg-[#A4D3DD] text-[#214E78] h-[8rem] rounded-xl p-1 mb-1">
              <DayPicker
                locale={ar}
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                weekStartsOn={6}
                className="rdp1 custom-day-picker"
                classNames={{
                  day_selected:
                    "bg-[#214E78] text-white rounded-full scale-110 shadow-md transition",
                  day: "rounded-full hover:bg-[#A4D3DD] hover:text-[#214E78]",
                }}
                disabled={disabledDays}
                styles={{
                  caption_label: {
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "#214E78",
                  },
                  head: {
                    color: "#214E78",
                    fontWeight: "600",
                    fontSize: "1.2rem", // ✅ Added this
                  },
                  day: {
                    fontSize: "2rem", // ✅ Added this
                  },
                  day_selected: {
                    backgroundColor: "#214E78",
                    color: "#fff",
                    padding: "118px",
                    fontSize: "1.2rem", // ✅ Added this
                  },
                }}
              />
            </div>

            {/* === Time Section === */}
            <h2 className="text-center text-xs font-semibold mb-3 border-y py-1 border-white/40 pb-2">
              الوقت / Time
            </h2>

            <div className="grid md:grid-cols-3 gap-10 md:gap-2 max-h-[140px] md:max-h-[200px] overflow-y-scroll">
              {timeGroups.map((group, index) => (
                <div
                  key={index}
                  className="flex flex-col mb-[80px] md:mb-0  items-center rounded-xl"
                >
                  <div className="flex text-[0.4em] flex-col pb-1 items-center mb-0 md:mb-2 border-b">
                    {group.icon}
                    <span className="text-center text-[0.5em] font-bold mt-1">
                      {group.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 w-full relative max-h-[15rem]  pt-2 ">
                    {group.times.map((time) => {
                      const convertedTime = time;

                      const selectedDateStr = selectedDate
                        ? selectedDate.toLocaleDateString("en-CA")
                        : "";

                      const slot = calendarData.find(
                        (s) =>
                          new Date(s.date).toLocaleDateString("en-CA") ===
                            selectedDateStr &&
                          s.time_slot.trim() === convertedTime.trim()
                      );

                      const status = slot?.status ?? "closed";
                      const isBooked = status === "booked";
                      const isClosed = status === "closed";
                      const isAvailable = status === "available";

                      return (
                        <label
                          key={time}
                          className={`relative flex justify-center items-center w-[85%] mx-auto py-1 rounded-lg cursor-pointer transition-all text-[0.5em] md:text-[0.6em] font-semibold 
        ${
          isBooked
            ? "bg-[#CCCCCC] text-[#214E78] cursor-not-allowed"
            : isClosed
            ? "bg-[#FFFFFF] text-[#214E78] cursor-not-allowed"
            : selectedTime === time
            ? "bg-[#6cb5c6] text-[#214E78]"
            : "bg-[#A4D3DD] text-[#214E78]"
        }
      `}
                        >
                          <input
                            type="checkbox"
                            disabled={!isAvailable}
                            checked={selectedTime === time}
                            onChange={() => setSelectedTime(time)}
                            className="hidden"
                          />
                          {time}
                          <span
                            className={`absolute right-[-8px] w-1.5 h-1.5 rounded-full ${
                              isBooked
                                ? "bg-[#CCCCCC]"
                                : isClosed
                                ? "bg-[#FFFFFF] border border-[#214E78]"
                                : "bg-[#A4D3DD]"
                            }`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === Legend Section === */}
          <section className="text-[0.6rem] flex justify-between px-6 p-1 bg-white text-[#214E78] font-bold w-[90%] md:w-[70%] mx-auto rounded-b-2xl">
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
        </>
      )}
    </>
  );
}
