"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import { FreeTrial } from "../free-trials/page";

export default function FreeTrialsTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-visible">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-xs relative">
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
function TableColumn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-2 text-xs ${className}`}>{children}</th>;
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
  children,
  status,
}: {
  data: FreeTrial;
  index: number;
  children?: React.ReactNode;
  status?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FreeTrial>(data);
  const [formatted, setFormatted] = useState("");

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updatedData = {
        ...formData,
        date_time: formatted, // keep as plain string
      };

      // --- 1️⃣ Update Free Trial data in main DB ---
      const res = await fetch("/api/update-free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      // --- 2️⃣ Prepare calendar slot ---
      const [date, time] = formatted.split(" ");
      if (!date || !time) {
        alert("❌ Invalid date/time format");
        setIsSaving(false);
        return;
      }

      // Convert to Arabic time + 15 minutes window
      function convertToArabicFormat(time: string) {
        const [hours, minutes] = time.split(":").map(Number);
        let period = "ص";
        let displayHours = hours;

        if (hours >= 12) period = "م";
        if (hours === 0 || hours === 12) displayHours = 12;
        else displayHours = hours % 12;

        const formattedHours = displayHours.toString().padStart(2, "0");
        const formattedMinutes = minutes.toString().padStart(2, "0");
        return `${formattedHours}:${formattedMinutes} ${period}`;
      }

      function add15Minutes(time: string) {
        const [hours, minutes] = time.split(":").map(Number);
        let newHours = hours;
        let newMinutes = minutes + 15;

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

      console.log("🗓️ Ready Slot:", readySlot);

      // --- 3️⃣ Update calendar slots ---
      const calendarRes = await fetch("/api/update_freeTrial_calendar", {
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

  useEffect(() => {
    if (formData.date_time) {
      const isoString = formData.date_time;
      const date = new Date(isoString);
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

  return (
    <tr className="bg-[#A4D3DD] h-fit relative">
      {/* Index */}
      <td className="px-4 py-2">{index + 1}</td>

      {/* Name */}
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

      {/* Phone */}
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

      {/* Email */}
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

      {/* Date & Time (as plain text input) */}
      <td dir="ltr" className="px-4 py-2 relative">
        {isEditing ? (
          <input
            type="text"
            className="bg-white text-black rounded-md px-2 py-1 w-full"
            // value={formData.date_time || ""}
            value={formatted || ""}
            onChange={(e) => setFormatted(e.target.value)}
          />
        ) : (
          formatted || ""
        )}
      </td>

      {/* Actions */}
      {status !== "completed" ? (
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
      ) : (
        <td></td>
      )}
    </tr>
  );
}

/* ------------------ STRUCTURE ATTACHMENTS ------------------ */
TableHeader.TableCoulmn = TableColumn;
TableContent.TableContentRow = TableContentRow;

FreeTrialsTable.TableHeader = TableHeader;
FreeTrialsTable.TableContent = TableContent;

// "use client";
// import { useEffect, useState } from "react";
// import NormalButton from "../_UI/NormalButton";
// import { FreeTrial } from "../free-trials/page";
// import { downloadTableAsPDF } from "@/lib/createPdf_free";

// export default function FreeTrialsTable({
//   children,
//   allData, // Add this prop to pass all loaded data
//   status, // Add this prop for filtering
// }: {
//   children: React.ReactNode;
//   allData?: FreeTrial[];
//   status?: string;
// }) {
//   return (
//     <div className="rounded-2xl overflow-visible">
//       {/* Add PDF Download Button */}
//       {allData && (
//         <div className="flex justify-end mb-4">
//           <NormalButton
//             bgColor="#214E78"
//             textColor="#FFFFFF"
//             onClick={() => downloadTableAsPDF(allData, status)}
//           >
//             تحميل PDF <br /> Download PDF
//           </NormalButton>
//         </div>
//       )}

//       <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-xs relative">
//         {children}
//       </table>
//     </div>
//   );
// }

// /* ------------------ HEADER ------------------ */
// function TableHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <thead className="bg-[#A4D3DD] text-[#214E78]">
//       <tr className="rounded-2xl">{children}</tr>
//     </thead>
//   );
// }

// /* ------------------ HEADER COLUMN ------------------ */
// function TableColumn({
//   children,
//   className,
// }: {
//   children: React.ReactNode;
//   className?: string;
// }) {
//   return <th className={`px-4 py-2 text-xs ${className}`}>{children}</th>;
// }

// /* ------------------ BODY ------------------ */
// function TableContent({ children }: { children: React.ReactNode }) {
//   return (
//     <tbody className="text-[#214E78] font-semibold overflow-auto">
//       {children}
//     </tbody>
//   );
// }

// /* ------------------ ROW ------------------ */
// function TableContentRow({
//   data,
//   index,
//   children,
//   status,
// }: {
//   data: FreeTrial;
//   index: number;
//   children?: React.ReactNode;
//   status?: string;
// }) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [formData, setFormData] = useState<FreeTrial>(data);
//   const [formatted, setFormatted] = useState("");

//   const handleSave = async () => {
//     try {
//       setIsSaving(true);

//       const updatedData = {
//         ...formData,
//         date_time: formatted,
//       };

//       const res = await fetch("/api/update-free-trial", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updatedData),
//       });

//       const [date, time] = formatted.split(" ");
//       if (!date || !time) {
//         alert("❌ Invalid date/time format");
//         setIsSaving(false);
//         return;
//       }

//       function convertToArabicFormat(time: string) {
//         const [hours, minutes] = time.split(":").map(Number);
//         let period = "ص";
//         let displayHours = hours;

//         if (hours >= 12) period = "م";
//         if (hours === 0 || hours === 12) displayHours = 12;
//         else displayHours = hours % 12;

//         const formattedHours = displayHours.toString().padStart(2, "0");
//         const formattedMinutes = minutes.toString().padStart(2, "0");
//         return `${formattedHours}:${formattedMinutes} ${period}`;
//       }

//       function add15Minutes(time: string) {
//         const [hours, minutes] = time.split(":").map(Number);
//         let newHours = hours;
//         let newMinutes = minutes + 15;

//         if (newMinutes >= 60) {
//           newHours += Math.floor(newMinutes / 60);
//           newMinutes = newMinutes % 60;
//           newHours = newHours % 24;
//         }

//         return `${newHours}:${newMinutes.toString().padStart(2, "0")}`;
//       }

//       function convertTimeWithPlus15(time: string) {
//         const originalTime = convertToArabicFormat(time);
//         const plus15Time = convertToArabicFormat(add15Minutes(time));
//         return `${originalTime} - ${plus15Time}`;
//       }

//       const selectedTime = convertTimeWithPlus15(time);
//       const readySlot = [
//         {
//           date,
//           time_slot: selectedTime,
//           status: "booked",
//         },
//       ];

//       const calendarRes = await fetch("/api/update_freeTrial_calendar", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ slots: readySlot }),
//       });

//       const result = await res.json();
//       const calResult = await calendarRes.json();

//       if (!result.success || !calResult.success) {
//         alert(
//           `❌ Update failed:\n${result.error || ""}\n${calResult.error || ""}`
//         );
//       } else {
//         alert("✅ Updated successfully!");
//         setIsEditing(false);
//       }
//     } catch (err) {
//       console.error("❌ Error saving:", err);
//       alert("Error while saving changes.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     setIsEditing(false);
//     setFormData(data);
//   };

//   useEffect(() => {
//     if (formData.date_time) {
//       const isoString = formData.date_time;
//       const date = new Date(isoString);
//       const formattedDate = date.toISOString().slice(0, 16).replace("T", " ");
//       setFormatted(formattedDate);
//     }
//   }, [formData.date_time]);

//   return (
//     <tr className="bg-[#A4D3DD] h-fit relative">
//       <td className="px-4 py-2">{index + 1}</td>

//       <td className="px-4 py-2">
//         {isEditing ? (
//           <input
//             type="text"
//             className="bg-white text-black rounded-md px-2 py-1 w-full"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//           />
//         ) : (
//           formData.name
//         )}
//       </td>

//       <td className="px-4 py-2">
//         {isEditing ? (
//           <input
//             type="text"
//             className="bg-white text-black rounded-md px-2 py-1 w-full"
//             value={formData.phone}
//             onChange={(e) =>
//               setFormData({ ...formData, phone: e.target.value })
//             }
//           />
//         ) : (
//           formData.phone
//         )}
//       </td>

//       <td className="px-4 py-2">
//         {isEditing ? (
//           <input
//             type="email"
//             className="bg-white text-black rounded-md px-2 py-1 w-full"
//             value={formData.email}
//             onChange={(e) =>
//               setFormData({ ...formData, email: e.target.value })
//             }
//           />
//         ) : (
//           formData.email
//         )}
//       </td>

//       <td dir="ltr" className="px-4 py-2 relative">
//         {isEditing ? (
//           <input
//             type="text"
//             className="bg-white text-black rounded-md px-2 py-1 w-full"
//             value={formatted || ""}
//             onChange={(e) => setFormatted(e.target.value)}
//           />
//         ) : (
//           formatted || ""
//         )}
//       </td>

//       {status !== "completed" ? (
//         <td className="px-4 py-2 mx-auto">
//           <div dir="ltr" className="flex justify-center gap-2">
//             {isEditing ? (
//               <>
//                 <NormalButton
//                   bgColor="#FFFFFF"
//                   textColor="black"
//                   onClick={handleCancel}
//                 >
//                   إلغاء <br /> Cancel
//                 </NormalButton>
//                 <NormalButton
//                   bgColor="#214E78"
//                   textColor="#FFFFFF"
//                   onClick={handleSave}
//                 >
//                   {isSaving ? (
//                     <>
//                       جاري الحفظ... <br /> Saving...
//                     </>
//                   ) : (
//                     <>
//                       حفظ <br /> Save
//                     </>
//                   )}
//                 </NormalButton>
//               </>
//             ) : (
//               <>
//                 <NormalButton
//                   bgColor="#214E78"
//                   textColor="#FFFFFF"
//                   onClick={() => setIsEditing(true)}
//                 >
//                   تعديل <br /> Edit
//                 </NormalButton>
//                 {!isEditing && children}
//               </>
//             )}
//           </div>
//         </td>
//       ) : (
//         <td></td>
//       )}
//     </tr>
//   );
// }

// TableHeader.TableCoulmn = TableColumn;
// TableContent.TableContentRow = TableContentRow;

// FreeTrialsTable.TableHeader = TableHeader;
// FreeTrialsTable.TableContent = TableContent;
