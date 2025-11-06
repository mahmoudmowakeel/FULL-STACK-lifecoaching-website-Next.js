"use client";
import Image from "next/image";
import NormalButton from "../_UI/NormalButton";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HiringApplication } from "../applications/page";

interface ApplicationsTableProps {
  data: HiringApplication[];
  status: "pending" | "completed";
  children?: React.ReactNode;
}

export default function ApplicationsTable({
  data,
  status,
  children,
}: ApplicationsTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openMessage, setOpenMessage] = useState<string | null>(null);

  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((d) => d.id));
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const selectedData = data.filter((d) => selectedIds.includes(d.id));
    const rows = selectedData.map((d) => [
      d.id,
      d.name,
      d.phone,
      d.email,
      d.message,
      d.created_at,
    ]);

    autoTable(doc, {
      head: [["#", "Name", "Phone", "Email", "Note", "Created At"]],
      body: rows,
    });

    doc.save("applications.pdf");
  };

  return (
    <div className="overflow-hidden rounded-2xl relative">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-[10px] ">
        {/* Header */}
        <thead className="bg-[#A4D3DD] text-[#214E78] p-5">
          <tr>
            <th className="px-2 py-2">
              <input
                type="checkbox"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
            </th>
            <th>#</th>
            <th>
              الاسم
              <br /> Name
            </th>
            <th>
              رقم الهاتف
              <br /> Phone
            </th>
            <th>
              البريد الإلكتروني
              <br /> Email
            </th>
            <th>
              الوقت و التاريخ
              <br /> Date & Time
            </th>
            <th>
              المفكره
              <br /> Note
            </th>
            <th>
              <NormalButton
                bgColor="#214E78"
                textColor="#FFFFFF"
                onClick={downloadPDF}
                disabled={selectedIds.length === 0}
              >
                PDF
                <Image
                  src="/Images/file-down.svg"
                  width={18}
                  height={18}
                  alt="pdf"
                />
              </NormalButton>
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="text-[#214E78] font-semibold overflow-auto">
          {data.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-4 text-center">
                لا توجد بيانات متاحة
              </td>
            </tr>
          ) : (
            data.map((app, index) => (
              <tr
                key={app.id}
                className={`bg-[#A4D3DD] h-fit text-[0.6rem] ${
                  selectedIds.includes(app.id)
                    ? "bg-opacity-80"
                    : "bg-opacity-100"
                }`}
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.id)}
                    onChange={() => toggleRow(app.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td>{index + 1}</td>
                <td>{app.name}</td>
                <td>{app.phone}</td>
                <td>{app.email}</td>
                <td>{new Date(app.created_at).toLocaleString()}</td>

                {/* ✅ Truncated message with popup on click */}
                <td
                  className="cursor-pointer max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                  title="انقر لعرض النص الكامل / Click to view full message"
                  onClick={() => setOpenMessage(app.message)}
                >
                  {app.message.length > 20
                    ? app.message.slice(0, 20) + "..."
                    : app.message}
                </td>

                <td>
                  {status === "pending" && (
                    <div dir="ltr" className="flex justify-center gap-2">
                      {children &&
                        (Array.isArray(children)
                          ? children[index]
                          : children)}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ✅ Message Modal */}
      {openMessage && (
        <div className="fixed inset-0 bg-black/65 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white h-[50vh] overflow-y-auto rounded-2xl shadow-xl p-6 max-w-lg w-[80%] relative text-center">
            <button
              onClick={() => setOpenMessage(null)}
              className="absolute top-2 right-3 text-[#214E78] text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-[#214E78] font-bold mb-3 text-sm">النص الكامل / Full Message</h3>
            <p className="text-[#214E78] text-md break-words whitespace-pre-wrap text-center">
              {openMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
