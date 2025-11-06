"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import { Reservation } from "../completed-reservations/page";
import Image from "next/image";

interface ReservationsTableProps {
  data: Reservation[];
  status: "pending" | "completed" | "canceled";
  selectedIds?: number[];
  toggleRow?: (id: number) => void;
  toggleSelectAll?: () => void;
  downloadPDF: () => void;
  children?: React.ReactNode;
}

export default function ReservationsTable({
  data,
  status,
  selectedIds = [],
  toggleRow,
  toggleSelectAll,
  downloadPDF,
}: ReservationsTableProps) {
  const isCompletedOrCanceled = status === "completed" || status === "canceled";

  return (
    <div className="overflow-hidden rounded-2xl">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-[9px]">
        <thead className="bg-[#A4D3DD] text-[#214E78]">
          <tr className="rounded-2xl">
            {/* ✅ Toggle column always visible if toggleRow exists */}
            {toggleRow && (
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === data.length && data.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
            )}
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">
              الاسم <br /> Name
            </th>
            <th className="px-4 py-2">
              رقم الهاتف <br /> Phone
            </th>
            <th className="px-4 py-2">
              البريد الالكتروني <br /> Email
            </th>
            <th className="px-4 py-2">
              الوقت و التاريخ <br /> Date & Time
            </th>
            <th className="px-4 py-2">
              نوع الحجز <br /> Type
            </th>
            <th className="px-4 py-2">
              طريقة الدفع <br /> Payment Method
            </th>
            <th className="px-4 py-2">
              رقم الفاتورة <br /> Invoice Number
            </th>
            <th className="px-4 py-2">
              الفاتورة <br /> Invoice
            </th>
            <th className="px-4 py-3">
              <NormalButton
                textColor="#FFFFFF"
                bgColor="#214E78"
                onClick={downloadPDF}
              >
                PDF
                <Image
                  src="/Images/file-down.svg"
                  width={20}
                  height={20}
                  alt="pdf"
                />
              </NormalButton>
            </th>
          </tr>
        </thead>

        <tbody className="text-[#214E78] font-semibold">
          {data.map((reservation, index) => (
            <ReservationRow
              key={reservation.id}
              data={reservation}
              index={index}
              selected={selectedIds.includes(reservation.id)}
              toggleRow={toggleRow}
              status={status}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------ ROW ------------------ */
interface ReservationRowProps {
  data: Reservation;
  index: number;
  selected?: boolean;
  toggleRow?: (id: number) => void;
  status: "pending" | "completed" | "canceled";
}

function ReservationRow({
  data,
  index,
  selected,
  toggleRow,
  status,
}: ReservationRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Reservation>(data);
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (formData.date_time) {
      const date = new Date(formData.date_time);
      setFormatted(date.toISOString().slice(0, 16).replace("T", " "));
    }
  }, [formData.date_time]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedData = { ...formData, date_time: formatted };
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const result = await res.json();
      if (!result.success) {
        alert("❌ Update failed.");
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

  const isCompletedOrCanceled = status === "completed" || status === "canceled";

  return (
    <tr className="bg-[#A4D3DD] h-fit text-[8px]">
      {/* ✅ Toggle checkbox always visible if toggleRow exists */}
      {toggleRow && (
        <td className="px-4 py-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleRow(data.id)}
          />
        </td>
      )}
      <td className="px-4 py-2">{index + 1}</td>
      <td className="px-4 py-2">{formData.name}</td>
      <td className="px-4 py-2">{formData.phone}</td>
      <td className="px-4 py-2">{formData.email}</td>
      <td className="px-4 py-2" dir="ltr">
        {formatted}
      </td>
      <td className="px-4 py-2">
        {data.type === "inPerson" ? "استماع ولقاء" : "استماع"}
      </td>
      <td className="px-4 py-2">
        {data.paymentMethod === "gateway"
          ? "بوابة دفع"
          : data.paymentMethod === "cash"
          ? "نقدا"
          : data.paymentMethod === "banktransfer"
          ? "تحويل بنكي"
          : "غير معروف"}
      </td>
      <td className="px-4 py-2">{data.invoice_number}</td>
      <td className="px-4 py-2">
        <a
          href={`data:application/pdf;base64,${data.invoice_pdf}`}
          download={`${data.invoice_number}.pdf`}
          className="text-blue-600 underline"
        >
          تحميل الفاتورة
        </a>
      </td>

      {/* Edit buttons only if pending */}
      <td className="px-4 py-2">
        {!isCompletedOrCanceled && (
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
              <NormalButton
                bgColor="#214E78"
                textColor="#FFFFFF"
                onClick={() => setIsEditing(true)}
              >
                تعديل <br /> Edit
              </NormalButton>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
