"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import { Reservation } from "../reservations/page";

export default function ReservationsTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-xs">
        {children}
      </table>
    </div>
  );
}

/* ------------------ HEADER ------------------ */
function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#A4D3DD] text-[#214E78]">
      <tr className="rounded-2xl">{children}</tr>
    </thead>
  );
}

/* ------------------ HEADER COLUMN ------------------ */
function TableColumn({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-[7px]">{children}</th>;
}

/* ------------------ BODY ------------------ */
function TableContent({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="text-[#214E78] font-semibold overflow-auto">
      {children}
    </tbody>
  );
}

/* ------------------ ROW ------------------ */
function TableContentRow({
  children,
  data,
  index,
  status,
}: {
  children?: React.ReactNode;
  data: Reservation;
  index: number;
  status?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Reservation>(data);
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (formData.date_time) {
      const date = new Date(formData.date_time);
      // const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      //   .toString()
      //   .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      //   .getHours()
      //   .toString()
      //   .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      const formattedDate = date.toISOString().slice(0, 16).replace("T", " ");
      setFormatted(formattedDate);
    }
  }, [formData.date_time]);

  /* ---------------- SAVE HANDLER ---------------- */
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updatedData = {
        ...formData,
        date_time: formatted, // store as plain string
      };

      // 1️⃣ Update reservation main record
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      // 2️⃣ Handle calendar slot time formatting
      const [date, time] = formatted.split(" ");
      if (!date || !time) {
        alert("❌ Invalid date/time format");
        setIsSaving(false);
        return;
      }

      // Time conversion helpers
      function convertToArabicFormat(time: string) {
        const [hours, minutes] = time.split(":").map(Number);
        let period = "ص";
        let displayHours = hours;

        if (hours >= 12) period = "م";
        if (hours === 0 || hours === 12) displayHours = 12;
        else displayHours = hours % 12;

        const formattedMinutes = minutes.toString().padStart(2, "0");
        return `${displayHours}:${formattedMinutes} ${period}`;
      }

      function add15Minutes(time: string) {
        const [hours, minutes] = time.split(":").map(Number);
        let newHours = hours;
        let newMinutes = minutes + 90;

        if (newMinutes >= 60) {
          newHours += Math.floor(newMinutes / 60);
          newMinutes = newMinutes % 60;
          newHours = newHours % 24;
        }

        return `${newHours}:${newMinutes.toString().padStart(2, "0")}`;
      }

      function convertTimeWithPlus15(time: string) {
        const originalTime = convertToArabicFormat(time);
        const plus15Time = convertToArabicFormat(add15Minutes(time));
        return `${originalTime} - ${plus15Time}`;
      }

      const selectedTime = convertTimeWithPlus15(time);
      const readySlot = [
        {
          date,
          time_slot: selectedTime,
          status: "booked",
        },
      ];

      // 3️⃣ Update reservation calendar
      const calendarRes = await fetch("/api/update_reservation_calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: readySlot }),
      });

      const result = await res.json();
      const calResult = await calendarRes.json();

      if (!result.success || !calResult.success) {
        alert(
          `❌ Update failed:\n${result.error || ""}\n${calResult.error || ""}`
        );
      } else {
        alert("✅ Updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("❌ Error saving:", err);
      alert("Error while saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(data);
  };

  return (
    <tr className="bg-[#A4D3DD] h-fit text-[8px]">
      <td className="px-4 py-2">{index + 1}</td>

      {/* Editable Fields */}
      <td className="px-4 py-2">
        {isEditing ? (
          <input
            type="text"
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        ) : (
          formData.name
        )}
      </td>

      <td className="px-4 py-2">
        {isEditing ? (
          <input
            type="text"
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        ) : (
          formData.phone
        )}
      </td>

      <td className="px-4 py-2">
        {isEditing ? (
          <input
            type="email"
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        ) : (
          formData.email
        )}
      </td>

      {/* DateTime (editable text) */}
      <td className="px-4 py-2" dir="ltr">
        {isEditing ? (
          <input
            type="text"
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={formatted}
            onChange={(e) => setFormatted(e.target.value)}
          />
        ) : (
          formatted
        )}
      </td>

      <td className="px-4 py-2 h-fit">
        {data.type == "inPerson" ? "استماع ولقاء" : "استماع"}
      </td>

      <td className="px-4 py-2 h-fit">
        {data.paymentMethod === "gateway"
          ? "بوابة دفع"
          : data.paymentMethod === "cash"
          ? "نقدا"
          : data.paymentMethod === "banktransfer"
          ? "تحويل بنكي"
          : "غير معروف"}
      </td>

      <td className="px-4 py-2 h-fit">{data.invoice_number}</td>

      <td className="px-4 py-2 h-fit">
        <a
          href={`data:application/pdf;base64,${data.invoice_pdf}`}
          download={`${data.invoice_number}.pdf`}
          className="text-blue-600 underline"
        >
          تحميل الفاتورة
        </a>
      </td>
      {status == "completed" || status == "canceled" ? (
        <td></td>
      ) : (
        <td className="px-4 py-2">
          <div dir="ltr" className="flex justify-center gap-2">
            {isEditing ? (
              <>
                <NormalButton
                  bgColor="#FFFFFF"
                  textColor="black"
                  onClick={handleCancel}
                >
                  إلغاء <br /> Cancel
                </NormalButton>
                <NormalButton
                  bgColor="#214E78"
                  textColor="#FFFFFF"
                  onClick={handleSave}
                >
                  {isSaving ? (
                    <>
                      جاري الحفظ... <br /> Saving...
                    </>
                  ) : (
                    <>
                      حفظ <br /> Save
                    </>
                  )}
                </NormalButton>
              </>
            ) : (
              <>
                <NormalButton
                  bgColor="#214E78"
                  textColor="#FFFFFF"
                  onClick={() => setIsEditing(true)}
                >
                  تعديل <br /> Edit
                </NormalButton>
                {!isEditing && children}
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

/* ------------------ STRUCTURE ATTACHMENTS ------------------ */
TableHeader.TableCoulmn = TableColumn;
TableContent.TableContentRow = TableContentRow;

ReservationsTable.TableHeader = TableHeader;
ReservationsTable.TableContent = TableContent;
