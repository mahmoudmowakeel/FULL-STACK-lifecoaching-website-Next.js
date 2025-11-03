"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ar } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";
import { FreeTrialFormData, ReservationFormData } from "@/lib/types/freeTrials";
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
  selectedDate?: Date | undefined;
  // setSelectedDate should update only the selectedDate
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;

  selectedTime?: string;
  // setSelectedTime should update only the selectedTime
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
}

export default function DateTimePickerReserve<T extends FormTypes>({
  formData,
  setFormData,
  type,
  selectedDate,
  selectedTime,
  setSelectedDate,
  setSelectedTime,
}: DateTimePickerProps<T>) {
  // const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  // const [selectedTime, setSelectedTime] = useState<string>("");
  const [calendarData, setCalendarData] = useState<CalendarSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // ✅ Fetch calendar data from API
  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/get_reservation_calendar");
        const data = await res.json();
        if (data.success) {
          setCalendarData(data.data);

          // ✅ convert to local date (YYYY-MM-DD)
          const localDates = data.data.map((d: CalendarSlot) =>
            new Date(d.date).toLocaleDateString("en-CA")
          );
          setAvailableDates(new Set(localDates));
        }
      } catch (err) {
        console.error("Failed to load calendar:", err);
      }
    }
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

    // setFormData(
    //   (prev) =>
    //     ({
    //       ...(prev as unknown as object),
    //       date_time: combinedDateTime.toISOString(),
    //     } as T)
    // );
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

  // ✅ Disable any day not in DB
  const disabledDays = (day: Date) => {
    const localDate = day.toLocaleDateString("en-CA");
    return !availableDates.has(localDate);
  };

  return (
    <>
      <div className="bg-[#2D638A] mt-[-10px] text-white px-4 py-2 rounded-t-2xl shadow-lg w-[65%] mx-auto">
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
            disabled={disabledDays}
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
            }}
          />
        </div>

        {/* === Time Section === */}
        <h2 className="text-center text-xs font-semibold mb-3 border-y py-1 border-white/40 pb-2">
          الوقت / Time
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {timeGroups.map((group, index) => (
            <div key={index} className="flex flex-col items-center rounded-xl">
              <div className="flex text-[0.4em] flex-col pb-1 items-center mb-2 border-b">
                {group.icon}
                <span className="text-center text-[0.5em] font-bold mt-1">
                  {group.label}
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full relative">
                {group.times.map((time) => {
                  const convertedTime = time;

                  // console.log(convertedTime)
                  // const selectedDateStr = selectedDate
                  //   ? selectedDate.toISOString().split("T")[0]
                  //   : "";
                  // const selectedDateStr = selectedDate
                  //   ? selectedDate.toLocaleDateString("en-CA") // stays local, no UTC conversion
                  //   : "";
                  console.log("heeeeree" + selectedDate);
                  // console.log(JSON.stringify(calendarData))
                  // const slot = calendarData.find(
                  //   (s) =>
                  //     s.date.split("T")[0] === selectedDateStr &&
                  //     s.time_slot.trim() === convertedTime.trim()
                  // );

                  const selectedDateStr = selectedDate
                    ? selectedDate.toLocaleDateString("en-CA")
                    : "";

                  const slot = calendarData.find(
                    (s) =>
                      new Date(s.date).toLocaleDateString("en-CA") ===
                        selectedDateStr &&
                      s.time_slot.trim() === convertedTime.trim()
                  );

                  console.log("heeeeree" + slot);

                  const status = slot?.status ?? "closed";
                  const isBooked = status === "booked";
                  const isClosed = status === "closed";
                  const isAvailable = status === "available";

                  return (
                    <label
                      key={time}
                      className={`relative flex justify-center items-center w-full py-1 rounded-lg cursor-pointer transition-all text-[0.6em] md:text-[0.5em] font-semibold 
        ${
          isBooked
            ? "bg-gray-400 cursor-not-allowed opacity-60"
            : isClosed
            ? "bg-gray-400 cursor-not-allowed opacity-60"
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
                        className={`absolute right-[-10px] w-1.5 h-1.5 rounded-full ${
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
      <section className="text-[0.6rem] flex justify-between px-6 p-1 bg-white text-[#214E78] font-bold w-[65%] mx-auto rounded-b-2xl">
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
  );
}
