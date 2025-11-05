// "use client";
// import { useEffect, useState } from "react";
// import NormalButton from "../_UI/NormalButton";
// import ContentContainer from "../_UI/ContentContainer";
// import { toast } from "sonner";

// interface AdditionalPageText {
//   type: "after_freetrial" | "first_entry" | "before_accept";
//   text_ar: string;
//   text_en: string;
// }

// export default function AdditionalPageNotesEditor() {
//   const [texts, setTexts] = useState<Record<string, AdditionalPageText>>({});
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   // ✅ Fetch existing texts
//   const fetchTexts = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/get-additional-page-texts");
//       const data = await res.json();
//       if (data.success) {
//         const mapped: Record<string, AdditionalPageText> = {};
//         data.data.forEach((row: AdditionalPageText) => {
//           mapped[row.type] = row;
//         });
//         setTexts(mapped);
//       } else {
//         toast.error("فشل تحميل البيانات!");
//       }
//     } catch (err) {
//       console.error("❌ Error fetching texts:", err);
//       toast.error("حدث خطأ أثناء الاتصال بالخادم.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTexts();
//   }, []);

//   // ✅ Save all updated texts at once
//   const handleSaveAll = async () => {
//     setSaving(true);
//     try {
//       const updates = Object.values(texts);

//       const res = await fetch("/api/update-additional-page-texts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updates), // ✅ send all updates at once
//       });

//       const data = await res.json();
//       if (data.success) {
//         toast.success("تم حفظ التغييرات بنجاح!");
//       } else {
//         toast.error("فشل الحفظ: " + data.error);
//       }
//     } catch (err) {
//       console.error("❌ Error saving:", err);
//       toast.error("حدث خطأ أثناء حفظ التغييرات!");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading)
//     return <p className="text-white text-center">جاري تحميل البيانات...</p>;

//   return (
//     <ContentContainer color="" title="الرسائل الثانويه / Secondary Messages">
//       <div className="w-full flex justify-center h-[80vh]">
//         {" "}
//         {/* Fixed height for container */}
//         <div className="bg-opacity-20 rounded-2xl w-full max-w-4xl text-right text-[#214E78] flex flex-col">
//           {/* Scrollable content area */}
//           <div className="flex-1 overflow-y-auto px-2 py-4">
//             <div className="space-y-6">
//               {["after_freetrial", "first_entry", "before_accept"].map(
//                 (type) => (
//                   <div key={type}>
//                     <h2 className="text-lg font-bold mb-4">
//                       {type === "after_freetrial"
//                         ? "بعد حجز التجربه المجانيه : التجربة المجانية"
//                         : type === "first_entry"
//                         ? "اول دخول للعميل : الصفحه الشخصيه / الحجز"
//                         : "قبل قبول العميل : الصفحه الشخصيه / الحجز"}
//                     </h2>

//                     {/* Arabic text */}
//                     <textarea
//                       value={texts[type]?.text_ar || ""}
//                       onChange={(e) =>
//                         setTexts({
//                           ...texts,
//                           [type]: {
//                             ...(texts[type] || {
//                               type: type as AdditionalPageText["type"],
//                               text_ar: "",
//                               text_en: "",
//                             }),
//                             text_ar: e.target.value,
//                           },
//                         })
//                       }
//                       className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md mb-3"
//                       rows={3}
//                     />

//                     {/* English text */}
//                     <textarea
//                       dir="ltr"
//                       value={texts[type]?.text_en || ""}
//                       onChange={(e) =>
//                         setTexts({
//                           ...texts,
//                           [type]: {
//                             ...(texts[type] || {
//                               type: type as AdditionalPageText["type"],
//                               text_ar: "",
//                               text_en: "",
//                             }),
//                             text_en: e.target.value,
//                           },
//                         })
//                       }
//                       className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md"
//                       rows={3}
//                     />
//                   </div>
//                 )
//               )}
//             </div>
//           </div>

//           {/* Fixed button at the bottom */}
//           <div className="flex justify-center items-end p-14  bg-transparent top-0">
//             <button
//               onClick={handleSaveAll}
//               disabled={saving}
//               className="bg-[#214E78] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1a3a5f] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {saving ? "جاري الحفظ..." : "حفظ / Save"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </ContentContainer>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import ContentContainer from "../_UI/ContentContainer";
import { toast } from "sonner";

interface AdditionalPageText {
  type: "after_freetrial" | "first_entry" | "before_accept" | "no_dates"; // ✅ Added "no_dates"
  text_ar: string;
  text_en: string;
}

export default function AdditionalPageNotesEditor() {
  const [texts, setTexts] = useState<Record<string, AdditionalPageText>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch existing texts
  const fetchTexts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-additional-page-texts");
      const data = await res.json();
      if (data.success) {
        const mapped: Record<string, AdditionalPageText> = {};
        data.data.forEach((row: AdditionalPageText) => {
          mapped[row.type] = row;
        });
        setTexts(mapped);
      } else {
        toast.error("فشل تحميل البيانات!");
      }
    } catch (err) {
      console.error("❌ Error fetching texts:", err);
      toast.error("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  // ✅ Save all updated texts at once
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.values(texts);

      const res = await fetch("/api/update-additional-page-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("تم حفظ التغييرات بنجاح!");
      } else {
        toast.error("فشل الحفظ: " + data.error);
      }
    } catch (err) {
      console.error("❌ Error saving:", err);
      toast.error("حدث خطأ أثناء حفظ التغييرات!");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="text-white text-center">جاري تحميل البيانات...</p>;

  return (
    <ContentContainer color="" title="الرسائل الثانويه / Secondary Messages">
      <div className="w-full flex justify-center h-[80vh]">
        <div className="bg-opacity-20 rounded-2xl w-full max-w-4xl text-right text-[#214E78] flex flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-6">
              {[
                "after_freetrial",
                "first_entry",
                "before_accept",
                "no_dates",
              ].map(
                // ✅ Added "no_dates"
                (type) => (
                  <div key={type}>
                    <h2 className="text-lg font-bold mb-4">
                      {type === "after_freetrial"
                        ? "بعد حجز التجربه المجانيه : التجربة المجانية"
                        : type === "first_entry"
                        ? "اول دخول للعميل : الصفحه الشخصيه / الحجز"
                        : type === "before_accept"
                        ? "قبل قبول العميل : الصفحه الشخصيه / الحجز"
                        : "لا يوجد تواريخ متاحه : التقويم"}{" "}
                      {/* ✅ Added label */}
                    </h2>

                    {/* Arabic text */}
                    <textarea
                      value={texts[type]?.text_ar || ""}
                      onChange={(e) =>
                        setTexts({
                          ...texts,
                          [type]: {
                            ...(texts[type] || {
                              type: type as AdditionalPageText["type"],
                              text_ar: "",
                              text_en: "",
                            }),
                            text_ar: e.target.value,
                          },
                        })
                      }
                      className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md mb-3"
                      rows={3}
                      placeholder="النص بالعربية"
                    />

                    {/* English text */}
                    <textarea
                      dir="ltr"
                      value={texts[type]?.text_en || ""}
                      onChange={(e) =>
                        setTexts({
                          ...texts,
                          [type]: {
                            ...(texts[type] || {
                              type: type as AdditionalPageText["type"],
                              text_ar: "",
                              text_en: "",
                            }),
                            text_en: e.target.value,
                          },
                        })
                      }
                      className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md"
                      rows={3}
                      placeholder="English text"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Fixed button at the bottom */}
          <div className="flex justify-center items-end p-14 bg-transparent top-0">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-[#214E78] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1a3a5f] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "جاري الحفظ..." : "حفظ / Save"}
            </button>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
