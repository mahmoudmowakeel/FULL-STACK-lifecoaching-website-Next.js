"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function HiringAdminPanel() {
  const [hiringOpen, setHiringOpen] = useState(false);
  const [hiringText, setHiringText] = useState("التوظيف مغلق حاليا");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initializing, setInitializing] = useState(true);

  // ✅ Fetch current data from DB when component mounts
  useEffect(() => {
    const fetchHiringStatus = async () => {
      try {
        const response = await fetch("/api/check-hiring-status");
        const data = await response.json();

        if (data.success) {
          setHiringOpen(!!data.hiringOpen);
          setHiringText(data.hiring_text || "التوظيف مغلق حاليا");
        } else {
          setMessage("⚠️ فشل في تحميل حالة التوظيف");
        }
      } catch (err) {
        console.error("Error fetching hiring status:", err);
        setMessage("⚠️ خطأ في الاتصال بالخادم");
      } finally {
        setInitializing(false);
      }
    };

    fetchHiringStatus();
  }, []);

  // ✅ Save changes to DB
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/toggle-hiring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiringOpen,
          hiring_text: hiringText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("تم حفظ التغييرات بنجاح");
      } else {
        toast.error(" حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // 🕓 Loading screen while fetching
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl">
        جاري تحميل البيانات...
      </div>
    );
  }

  return (
    <div>
      <h2 dir="ltr" className="text-2xl ml-auto w-fit mb-4 px-6 text-[#214E78] font-bold"> Hiring / التوظيف</h2>
      <div className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-6 w-[60%] mx-auto mt-[-70px]">
        {/* Toggle Checkbox */}
        <div
          dir="ltr"
          className="flex items-center  justify-end gap-5 mb-6 bg-[#214E78] w-full py-1.5 px-5 rounded-2xl "
        >
          <label htmlFor="hiringOpen" className="text-lg text-white font-bold">
            التوظيف
          </label>
          <input
            id="hiringOpen"
            type="checkbox"
            checked={hiringOpen}
            onChange={(e) => setHiringOpen(e.target.checked)}
            className={`
    w-5 h-5 cursor-pointer rounded-full border-2 border-white 
    appearance-none 
    transition-all duration-200
    ${hiringOpen ? "bg-white" : "bg-transparent"}
  `}
          />
        </div>

        {/* Hiring Text Input */}
        <textarea
          value={hiringText}
          onChange={(e) => setHiringText(e.target.value)}
          className="w-full bg-[#A4D3DD] text-[#214E78] rounded-md p-3 text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#A4D3DD] shadow-2xl"
          rows={3}
        />

        {/* Save Button */}
        <button
          dir="ltr"
          onClick={handleSave}
          disabled={loading}
          className="mt-6 px-6 py-2 rounded-md bg-[#214E78] text-white font-semibold mr-auto cursor-pointer transition disabled:opacity-60 shadow-2xl"
        >
          {loading ? "جارٍ الحفظ..." : "Save / حفظ"}
        </button>
      </div>    
    </div>
  );
}
