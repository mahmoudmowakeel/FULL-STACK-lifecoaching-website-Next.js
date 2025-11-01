"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import ContentContainer from "../_UI/ContentContainer";
import { toast } from "sonner";

interface FinalPageText {
  type:
    | "free_trial"
    | "reservation"
    | "edit"
    | "complete_reservation"
    | "cancel_reservation"
    | "apply";
  text_ar: string;
  text_en: string;
}

export default function FinalPageTextsEditor() {
  const [texts, setTexts] = useState<Record<string, FinalPageText>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-final-page-texts");
      const data = await res.json();
      if (data.success) {
        const mapped: Record<string, FinalPageText> = {};
        data.data.forEach((r: FinalPageText) => (mapped[r.type] = r));
        setTexts(mapped);
      } else toast.error("فشل تحميل البيانات!");
    } catch {
      toast.error("خطأ في الاتصال بالخادم!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/update-final-page-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.values(texts)),
      });
      const data = await res.json();
      if (data.success) toast.success("تم الحفظ بنجاح!");
      else toast.error("فشل الحفظ!");
    } catch {
      toast.error("حدث خطأ أثناء الحفظ!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white text-center">تحميل...</p>;

  const types = [
    "free_trial",
    "reservation",
    "edit",
    "complete_reservation",
    "cancel_reservation",
    "apply",
  ];

  const labels: Record<string, string> = {
    free_trial: "التجربة المجانية",
    reservation: "الحجز",
    edit: "تعديل",
    complete_reservation: "إتمام الحجز",
    cancel_reservation: "إلغاء الحجز",
    apply: "التقديم",
  };

  return (
    <ContentContainer color="" title="الرسائل الاساسيه والثانويه / Primary & Secondary Messages">
      <div className="w-full flex justify-center h-[80vh]"> {/* Fixed height for container */}
        <div className="bg-opacity-20 rounded-2xl w-full max-w-4xl text-right text-[#214E78] flex flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-6">
              {types.map((type) => (
                <div key={type}>
                  <h2 className="text-lg font-bold mb-4">{labels[type]}</h2>

                  <textarea
                    value={texts[type]?.text_ar || ""}
                    onChange={(e) =>
                      setTexts({
                        ...texts,
                        [type]: {
                          ...(texts[type] || {
                            type: type as FinalPageText["type"],
                            text_ar: "",
                            text_en: "",
                          }),
                          text_ar: e.target.value,
                        },
                      })
                    }
                    className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md mb-3"
                    rows={3}
                  />

                  <textarea
                    dir="ltr"
                    value={texts[type]?.text_en || ""}
                    onChange={(e) =>
                      setTexts({
                        ...texts,
                        [type]: {
                          ...(texts[type] || {
                            type: type as FinalPageText["type"],
                            text_ar: "",
                            text_en: "",
                          }),
                          text_en: e.target.value,
                        },
                      })
                    }
                    className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fixed button at the bottom */}
          <div className="flex justify-center items-end p-14  bg-transparent top-0">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-[#214E78] text-white px-3 py-2 rounded-md font-medium hover:bg-[#1a3a5f] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "جاري الحفظ..." : "حفظ / Save"}
            </button>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}