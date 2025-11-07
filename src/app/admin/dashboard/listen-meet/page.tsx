"use client";
import { useEffect, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import { toast } from "sonner";

export interface ListeningOptions {
  id: number;
  listen_status: boolean;
  listen_text: string;
  listen_price: number;
  listen_meet_status: boolean;
  listen_meet_text: string;
  listen_meet_price: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function ListenMeetPage() {
  const [data, setData] = useState<ListeningOptions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // ✅ Fetch existing data
  const fetchData = async (): Promise<void> => {
    try {
      const res = await fetch("/api/get-listening-options");
      const json: ApiResponse<ListeningOptions> = await res.json();
      if (json.success && json.data) {
        setData({
          ...json.data,
          listen_status: Boolean(json.data.listen_status),
          listen_meet_status: Boolean(json.data.listen_meet_status),
        });
      }
    } catch (error) {
      console.error("Error loading listening data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Handle field change
  const handleChange = <K extends keyof ListeningOptions>(
    field: K,
    value: ListeningOptions[K]
  ): void => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  // ✅ Save changes
  const handleSave = async (): Promise<void> => {
    if (!data) return;
    setSaving(true);

    try {
      const res = await fetch("/api/update-listening-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, listen_status: true }),
      });

      const json: ApiResponse<null> = await res.json();
      if (json.success) toast.success("تم حفظ التغييرات بنجاح!");
      else toast.error(`❌ فشل في الحفظ: ${json.error ?? ""}`);
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ContentContainer
        color="rgba(164, 211, 221, 0.7)"
        title="استماع - استماع ولقاء / Listen - Listen And Meet"
      >
        {loading ? (
          <div className="w-full text-center">
            <p className="text-white w-full p-5 text-2xl mx-auto text-center">
              جاري تحميل البيانات ...
            </p>
          </div>
        ) : (
          <div className="w-[70%] absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col gap-6 mt-7">
              {/* 🔹 استماع */}
              <section className="flex flex-col gap-2">
                <div className="flex justify-between w-full items-center">
                  <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-2 rounded-2xl text-white">
                    <span className="font-bold">استماع / Listen</span>
                  </label>

                  <span className="font-bold text-[#214E78] flex items-center">
                    <input
                      type="number"
                      value={data?.listen_price}
                      onChange={(e) =>
                        handleChange("listen_price", Number(e.target.value))
                      }
                      className="text-white bg-[#214E78] py-1 px-4 rounded-2xl ml-3 w-24 text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    درهم
                  </span>
                </div>

                <textarea
                  value={data?.listen_text}
                  onChange={(e) => handleChange("listen_text", e.target.value)}
                  className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3 border rounded-lg h-[5rem]"
                />
              </section>

              {/* 🔹 استماع ولقاء */}
              <section className="flex flex-col gap-2">
                <div className="flex justify-between w-full items-center">
                  <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-2 rounded-2xl text-white">
                    <input
                      type="checkbox"
                      checked={data?.listen_meet_status}
                      onChange={(e) =>
                        handleChange("listen_meet_status", e.target.checked)
                      }
                      className="hidden peer"
                    />
                    <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white peer-checked:bg-white transition-all">
                      <span className="w-2.5 h-2.5 bg-[#214E78] rounded-full opacity-0 peer-checked:opacity-100 transition-all"></span>
                    </span>
                    <span className="font-bold">
                      استماع ولقاء / Listen And Meet
                    </span>
                  </label>

                  <span className="font-bold text-[#214E78] flex items-center">
                    <input
                      type="number"
                      value={data?.listen_meet_price}
                      onChange={(e) =>
                        handleChange(
                          "listen_meet_price",
                          Number(e.target.value)
                        )
                      }
                      className="text-white bg-[#214E78] py-1 px-4 rounded-2xl ml-3 w-24 text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    ريال
                  </span>
                </div>

                <textarea
                  value={data?.listen_meet_text}
                  onChange={(e) =>
                    handleChange("listen_meet_text", e.target.value)
                  }
                  className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3 border rounded-lg h-[5rem]"
                />
              </section>

              {/* Save Button */}
              <div dir="ltr" className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#214E78] text-white py-2 px-6 text-md rounded-md cursor-pointer hover:bg-[#183d5a] disabled:opacity-50"
                >
                  {saving ? "جاري الحفظ..." : "Save / حفظ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
