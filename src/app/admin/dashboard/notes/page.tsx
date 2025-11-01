"use client";
import { useEffect, useState } from "react";
import NormalButton from "../_UI/NormalButton";
import ContentContainer from "../_UI/ContentContainer";
import { toast } from "sonner";

interface PageText {
  type: "free_trials" | "reservations";
  text_ar: string;
  text_en: string;
}

export default function PageTextsEditor() {
  const [texts, setTexts] = useState<Record<string, PageText>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch existing texts
  const fetchTexts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-page-notes");
      const data = await res.json();
      if (data.success) {
        const mapped: Record<string, PageText> = {};
        data.data.forEach((row: PageText) => {
          mapped[row.type] = row;
        });
        setTexts(mapped);
      }
    } catch (err) {
      console.error("❌ Error fetching texts:", err);
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
      for (const entry of updates) {
        await fetch("/api/update-page-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: entry.type,
            text_ar: entry.text_ar,
            text_en: entry.text_en,
          }),
        });
      }
      toast.success("تم حفظ التغييرات بنجاح!");
    } catch (err) {
      toast.error("حدث خظا اثناء حفظ التغييرات!");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="text-white text-center">جاري تحميل البيانات...</p>;

  return (
    <ContentContainer color="" title="الملاحظات / Notes">
      <div className="w-full flex justify-center">
        <div className=" bg-opacity-20  rounded-2xl w-full max-w-4xl text-right text-[#214E78]">
          {["free_trials", "reservations"].map((type) => (
            <div key={type}>
              <h2 className="text-lg font-bold mb-4">
                {type === "free_trials" ? "التجربة المجانية" : "الحجز"}
              </h2>

              {/* Arabic text */}
              <textarea
                value={texts[type]?.text_ar || ""}
                onChange={(e) =>
                  setTexts({
                    ...texts,
                    [type]: { ...texts[type], text_ar: e.target.value },
                  })
                }
                className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md mb-3"
                rows={2}
              />

              {/* English text */}
              <textarea
                dir="ltr"
                value={texts[type]?.text_en || ""}
                onChange={(e) =>
                  setTexts({
                    ...texts,
                    [type]: { ...texts[type], text_en: e.target.value },
                  })
                }
                className="w-full border bg-[#D9F3FA] text-[#214E78] p-3 rounded-md"
                rows={2}
              />
            </div>
          ))}

          {/* ✅ Single Save button for all */}

          <div className="flex justify-center items-end p-1  bg-transparent top-0">
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
