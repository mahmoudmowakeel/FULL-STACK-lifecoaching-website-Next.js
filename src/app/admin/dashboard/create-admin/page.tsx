"use client";

import { use, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import { toast } from "sonner";

export default function ReservationButton() {
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handelVerfication(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMessage("الرجاء إدخال البريد الإلكتروني أولاً.");
      return;
    }
    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("تم ارسال كود التحقق الي البريد الالكتروني.");
        setOtp(data.code);
      } else {
        setMessage("خطأ في ارسال كود التحقق برجاء المحاولة مره اخري.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setMessage("حدث خطأ أثناء إرسال كود التحقق.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    if (otp != formOtp) {
      setMessage("كود التحقق خطأ , برجاء ادخاله مره اخري بشكل صحيح.");
      return;
    }

    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("تم تعيين ادمن بنجاح");
        setEmail("");
      } else {
        toast.error("خطا اثناء تعيين الادمن");
      }
    } catch (err) {
      toast.error("خطا اثناء تعيين الادمن");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ContentContainer
        color="rgba(164, 211, 221, 0.7)"
        title="تعيين ادمن / Assign Admin"
      >
        <div className="w-[70%] absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2">
          <form className="text-[#214E78] font-bold flex flex-col justify-between items-center h-fit gap-7 text-center mt-[60px] px-4 sm:px-8 md:px-12">
            <label className="text-sm sm:text-base md:text-lg">
              البريد الالكتروني
            </label>
            <input
              name="email"
              type="text"
              placeholder="ادخل البريد الالكتروني"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-[60%] sm:w-[80%] md:w-[75%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
            />
            <label className="text-sm sm:text-base md:text-lg">
              كود التحقق
            </label>
            <div className="w-full relative">
              <input
                type="text"
                placeholder="ادخل كود التحقق"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormOtp(e.target.value)
                }
                value={formOtp}
                className="w-[60%] sm:w-[80%] md:w-[75%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
              />
              <button
                type="button"
                className="absolute left-[4rem] sm:left-[3.5rem] md:left-[5.5rem] top-2 sm:top-1 text-[#214E78] text-[8px] sm:text-xs bg-[#A4D3DD] py-1 px-2 sm:py-2 sm:px-3 rounded-lg cursor-pointer"
                onClick={handelVerfication}
              >
                تحقق
              </button>
            </div>
            {message ? (
              <p className="text-xs p-0 m-0 text-red-500">{message}</p>
            ) : (
              ""
            )}
            <div className="overflow-visible mr-auto mt-[30px]">
              <button
                onClick={handleSubmit}
                type="button"
                className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
              >
                {loading ? "جاري التعيين..." : "تعيين"}
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </>
  );
}
