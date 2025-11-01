"use client";
import { useState } from "react";
import NormalButton from "../_UI/NormalButton";
import { FreeTrial } from "../free-trials/page";

export default function EditTable({ children }: { children: React.ReactNode }) {
 
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
  return <th className="px-4 py-2 text-xs">{children}</th>;
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
  data,
  index,
  onSave,
}: {
  data: FreeTrial;
  index: number;
  onSave?: (updated: Partial<FreeTrial>) => Promise<void> | void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<FreeTrial>>({});
  const [localData, setLocalData] = useState<FreeTrial>(data);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FreeTrial
  ) => {
    const value = e.target.value;
    setEditData((prev) => ({ ...prev, [field]: value }));
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // ✅ Only send changed fields + id (no date_time)
      const updatedFields: Partial<FreeTrial> = { id: data.id, ...editData };
      delete updatedFields.date_time; // ensure date not sent
      if (onSave) await onSave(updatedFields);
      setIsEditing(false);
      setEditData({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalData(data);
    setEditData({});
    setIsEditing(false);
  };

  const date = new Date(localData.date_time as string);
  const formatted = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  return (
    <tr className="bg-[#A4D3DD] h-fit">
      <td className="px-4 py-2">{index + 1}</td>

      {/* Name */}
      <td className="px-4 py-2">
        {isEditing ? (
          <input
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={localData.name}
            onChange={(e) => handleChange(e, "name")}
          />
        ) : (
          localData.name
        )}
      </td>

      {/* Phone */}
      <td className="px-4 py-2">
        {isEditing ? (
          <input
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={localData.phone}
            onChange={(e) => handleChange(e, "phone")}
          />
        ) : (
          localData.phone
        )}
      </td>

      {/* Email */}
      <td className="px-4 py-2">
        {isEditing ? (
          <input
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            value={localData.email}
            onChange={(e) => handleChange(e, "email")}
          />
        ) : (
          localData.email
        )}
      </td>

      {/* Date & Time (fixed text, not input) */}
      <td dir="ltr" className="px-4 py-2">
        {formatted}
      </td>

      {/* Actions */}
      <td className="px-4 py-2 mx-auto">
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
      </td>
    </tr>
  );
}

/* ------------------ STRUCTURE ATTACHMENTS ------------------ */
TableHeader.TableCoulmn = TableColumn;
TableContent.TableContentRow = TableContentRow;

EditTable.TableHeader = TableHeader;
EditTable.TableContent = TableContent;
