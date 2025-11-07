"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import { FreeTrial } from "../free-trials/page";

interface FreeTrialsTableProps {
  data: FreeTrial[];
  selectedIds?: number[];
  toggleRow?: (id: number) => void;
  toggleSelectAll?: () => void;
  handleComplete?: (id: number) => void;
  downloadPDF: () => void;
  status?: "pending" | "completed";
  openModalForTrial?: (id: number, date: string) => void;
  handleSave?: (id: number, name: string, email: string) => void;
}

export default function FreeTrialsTable({
  data,
  selectedIds = [],
  toggleRow,
  toggleSelectAll,
  handleComplete,
  downloadPDF,
  handleSave,
  status = "pending",
  openModalForTrial,
}: FreeTrialsTableProps) {
  const isCompleted = status === "completed";

  return (
    <div className="rounded-2xl overflow-visible">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-xs relative">
        <thead className="bg-[#A4D3DD] text-[#214E78]">
          <tr>
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
              الاسم
              <br />
              Name
            </th>
            <th className="px-4 py-2">
              رقم الهاتف
              <br />
              Phone
            </th>
            <th className="px-4 py-2">
              البريد الالكتروني
              <br />
              Email
            </th>
            <th className="px-4 py-2">
              الوقت و التاريخ
              <br />
              Date & Time
            </th>
            <th className="px-4 py-2">
              <NormalButton
                textColor="#FFFFFF"
                bgColor="#214E78"
                onClick={downloadPDF}
              >
                PDF
              </NormalButton>
            </th>
          </tr>
        </thead>

        <tbody className="text-[#214E78] font-semibold">
          {data.map((trial, index) => (
            <TableContentRow
              key={trial.id}
              data={trial}
              index={index}
              selected={selectedIds.includes(trial.id)}
              toggleRow={toggleRow}
              handleComplete={handleComplete}
              editable={status === "pending"}
              showCompleteButton={status === "pending"}
              openModalForTrial={openModalForTrial!}
              handleSave={handleSave}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------ ROW ------------------ */
interface TableContentRowProps {
  data: FreeTrial;
  index: number;
  selected?: boolean;
  toggleRow?: (id: number) => void;
  handleComplete?: (id: number) => void;
  editable: boolean;
  showCompleteButton: boolean;
  openModalForTrial: (id: number, date: string) => void;
  handleSave?: (id: number, name: string, email: string) => void;
}

function TableContentRow({
  data,
  index,
  selected,
  toggleRow,
  handleComplete,
  editable,
  showCompleteButton,
  openModalForTrial,
  handleSave,
}: TableContentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FreeTrial>(data);
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (formData.date_time) {
      const date = new Date(formData.date_time);
      setFormatted(date.toISOString().slice(0, 16).replace("T", " "));
    }
  }, [formData.date_time]);

  return (
    <tr className="bg-[#A4D3DD] h-fit relative">
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
        <div dir="ltr" className="flex justify-center gap-2">
          {editable && (
            <>
              {isEditing ? (
                <>
                  <NormalButton
                    bgColor="#FFFFFF"
                    textColor="black"
                    onClick={() => setIsEditing(false)}
                  >
                    إلغاء <br /> Cancel
                  </NormalButton>
                  <NormalButton
                    bgColor="#214E78"
                    textColor="#FFFFFF"
                    onClick={() => handleSave?.(data.id, data.email, data.name)}
                  >
                    حفظ <br /> Save
                  </NormalButton>
                </>
              ) : (
                <>
                  {editable && (
                    <NormalButton
                      bgColor="#214E78"
                      textColor="#FFFFFF"
                      onClick={() => {
                        setIsEditing(true);
                        openModalForTrial(
                          formData.id,
                          formData.date_time || ""
                        );
                      }}
                    >
                      تعديل <br /> Edit
                    </NormalButton>
                  )}
                  {showCompleteButton && handleComplete && (
                    <NormalButton
                      bgColor="#FFFFFF"
                      textColor="#214E78"
                      onClick={() => handleComplete(data.id)}
                    >
                      اتمام <br /> Complete
                    </NormalButton>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
