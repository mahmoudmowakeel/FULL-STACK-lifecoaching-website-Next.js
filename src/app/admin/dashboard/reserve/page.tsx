"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ReservationFormData } from "@/lib/types/freeTrials";
import ContentContainer from "../_UI/ContentContainer";
import DateTimePicker from "@/app/[locale]/components/DateTimePicker";
import { ApiResponse, ListeningOptions } from "../listen-meet/page";
import DateTimePickerReserve from "@/app/[locale]/components/DateTimePicker_reserve";
import AdminDateTimePickerReserve from "../_components/ReservePicketForAdmin";
import { Reservation } from "../reservations/page";

export default function ReservationButton() {
  const [step, setStep] = useState<number>(1);
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [formData, setFormData] = useState<ReservationFormData>({
    email: "",
    date_time: null,
    type: "",
    amount: "200",
    paymentMethod: "",
    payment_bill: "no bill",
  });

  const [open, setOpen] = useState(false);
  const [isProcessingReservation, setIsProcessingReservation] = useState(false);
  const [data, setData] = useState<ListeningOptions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeData, setTypeData] = useState<ListeningOptions>();
  // ✅ Fetch existing data
  const fetcTypehData = async (): Promise<void> => {
    try {
      const res = await fetch("/api/get-listening-options");
      const json: ApiResponse<ListeningOptions> = await res.json();
      if (json.success && json.data) {
        setTypeData({
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
    fetcTypehData();
    fetchData();
  }, []);

  // Calculate amount based on reservation type (kept same logic)
  const getAmount = () => {
    // helper to convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
    const normalizeArabicNumbers = (
      str: string | number | undefined
    ): string => {
      if (!str) return "0";
      return String(str).replace(/[٠-٩]/g, (d) =>
        String(d.charCodeAt(0) - 1632)
      );
    };

    // pick the right price field
    let priceStr = "0";
    switch (formData.type) {
      case "online":
        priceStr = normalizeArabicNumbers(typeData?.listen_price);
        break;
      case "inPerson":
        priceStr = normalizeArabicNumbers(typeData?.listen_meet_price);
        break;
      default:
        priceStr = normalizeArabicNumbers(typeData?.listen_price);
    }

    // convert to number of fils (Stripe expects smallest currency unit)
    const priceAed = parseFloat(priceStr); // e.g. 49.99
    const amountInFils = Math.round(priceAed * 100); // e.g. 4999

    return amountInFils;
  };

  // ADMIN submit: no payment gateway — create reservation, meeting, and send emails
  const handleSubmit = async () => {
    if (!formData.paymentMethod) {
      setMessage("حقل طريقة الدفع مطلوب برجاء ادخاله.");
      return;
    }

    setMessage("جاري تأكيد الحجز...");
    setPaymentStatus("processing");
    setIsProcessingReservation(true);

    try {
      let formattedDate = formData.date_time;
      if (formattedDate) {
        const date = new Date(formattedDate);
        formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }
      // 1) Create reservation (status pending)
      const reservationResponse = await fetch("/api/create-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_bill: "manual_admin_booking",
          email: formData.email,
          date_time: formattedDate,
          type: formData.type,
          amount: getAmount(),
          status: "pending",
          paymentMethod: formData.paymentMethod,
        }),
      });

      if (!reservationResponse.ok) {
        const errBody = await reservationResponse.json().catch(() => null);
        const errMsg = errBody?.error ?? "Failed to create reservation";
        throw new Error(errMsg);
      }

      // reservation created successfully
      setMessage("تم حفظ الحجز بنجاح! جارٍ إنشاء الاجتماع...");
      setPaymentStatus("processing");

      // 2) Create Google Meet event
      // Build start/end ISO strings
      const startTime = new Date(formData.date_time!);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

      const meetingResponse = await fetch("/api/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          summary: "Life Coach Meeting",
          description: `Life coaching session for ${formData.email}`,
        }),
      });

      const meetingData = await meetingResponse.json();

      if (!meetingResponse.ok || !meetingData.success) {
        // Meeting creation failed — still reservation exists; show error
        console.error("Meeting creation failed:", meetingData);
        throw new Error(
          meetingData.error || "فشل في إنشاء اجتماع Google Meet."
        );
      }

      // 3) Send meeting emails (customer + admin)
      const reservationData: Reservation = await reservationResponse.json();
      const emailResponse = await fetch("/api/send-meeting-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.email || "العميل",
          customerEmail: formData.email,
          meetingDetails: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            summary: formData.type,
            meetLink: meetingData.hangoutLink,
            eventLink: meetingData.eventLink,
          },
          pdfInvoice: reservationData.invoice_pdf, // ✅ attach PDF
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok || !emailResult.success) {
        console.error("Email send failed:", emailResult);
        throw new Error(emailResult.error || "فشل في إرسال البريد الإلكتروني.");
      }

      // **Update the calendar slot to "booked" after successful booking**
      const selectedDateISO = selectedDate
        ? new Date(
            selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
          )
            .toISOString()
            .split("T")[0]
        : "";

      const readySlot = [
        {
          date: selectedDateISO,
          time_slot: selectedTime,
          status: "booked",
        },
      ];
      const updateSlotResponse = await fetch(
        "/api/update_reservation_calendar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slots: readySlot,
          }),
        }
      );

      const updateSlotData = await updateSlotResponse.json();
      if (!updateSlotResponse.ok || !updateSlotData.success) {
        console.error("⚠️ Calendar update failed:", updateSlotData.error);
        throw new Error("فشل في تحديث التقويم.");
      }

      // All done: meeting created and emails sent
      setPaymentStatus("success");
      setMessage(
        "✅ تم تأكيد الحجز وإرسال تفاصيل الاجتماع إلى بريدك الإلكتروني."
      );

      // Reset form after short delay
      setTimeout(() => {
        setOpen(false);
        setStep(1);
        setPaymentStatus("idle");
        setFormData({
          email: "",
          date_time: null,
          type: "",
          amount: "200",
          paymentMethod: "",
          payment_bill: "no bill",
        });
        setMessage("");
        setFormOtp("");
        setOtp("");
        setSelectedDate(undefined);
        setSelectedTime("");
      }, 3000);
    } catch (err) {
      console.error("Error in admin reservation flow:", err);
      setPaymentStatus("error");
      setMessage(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "حدث خطأ أثناء معالجة الحجز."
      );
    } finally {
      setIsProcessingReservation(false);
    }
  };

  const handlePaymentError = (error: string) => {
    // kept for compatibility but admin flow doesn't use payment modal
    setMessage(`خطأ: ${error}`);
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step == 1) {
      if (!formData.email) {
        setMessage("حقل البريد الالكتروني مطلوب برجاء ادخاله.");
        return;
      }
      if (otp != formOtp) {
        setMessage("كود التحقق خطأ , برجاء ادخاله مره اخري بشكل صحيح.");
        return;
      }
    }
    if (step == 2) {
      if (!formData.date_time) {
        setMessage("حقل الوقت والتاريخ مطلوب برجاء ادخاله.");
        return;
      }
    }
    if (step == 3) {
      if (!formData.type) {
        setMessage("حقل نوع الحجز مطلوب برجاء ادخاله.");
        return;
      }
    }

    setMessage("");
    setStep((s) => s + 1);
  }

  function handlePrev(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setStep((s) => s - 1);
  }

  const handleCheckbox = (type: string) => {
    setFormData((prev: ReservationFormData) => ({
      ...prev,
      type: prev.type === type ? "" : type,
    }));
  };
  const handleCheckboxPayment = (paymentMethod: string) => {
    setFormData((prev: ReservationFormData) => ({
      ...prev,
      paymentMethod: prev.paymentMethod === paymentMethod ? "" : paymentMethod,
    }));
  };

  async function handelVerfication(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email) {
      setMessage("الرجاء إدخال البريد الإلكتروني أولاً.");
      return;
    }
    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
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

  const handleCloseModal = () => {
    if (paymentStatus === "processing") return;
    setPaymentStatus("idle");
    setOpen(false);
    setStep(1);
    setPaymentStatus("idle");
    setFormData({
      email: "",
      date_time: null,
      type: "",
      amount: "200",
      paymentMethod: "",
      payment_bill: "no bill",
    });
    setMessage("");
    setFormOtp("");
    setOtp("");
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <>
      <ContentContainer
        color="rgba(164, 211, 221, 0.7)"
        title="الحجز / Reserve"
      >
        <div className="w-[70%] absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2">
          {/* Overlays for processing / success / error */}
          {paymentStatus === "processing" && (
            <div className="fixed inset-0 bg-[rgba(164, 211, 221, 0.7)] bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-[rgba(164, 211, 221, 0.7)] p-6 rounded-lg text-center max-w-sm mx-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-[#214E78]">
                  جاري تأكيد الحجز...
                </p>
                <p className="text-gray-600 mt-2">
                  برجاء الانتظار حتى يتم تأكيد بيانات الحجز
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="fixed inset-0 bg-[rgba(164, 211, 221, 0.7)] bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-[rgba(164, 211, 221, 0.7)] p-6 rounded-lg text-center max-w-sm mx-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  تم تأكيد الحجز بنجاح!
                </p>
                <p className="text-gray-600 mt-2">
                  سيتم إغلاق النافذة تلقائياً
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="fixed inset-0 bg-[rgba(164, 211, 221, 0.7)] bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-[rgba(164, 211, 221, 0.7)] p-6 rounded-lg text-center max-w-sm mx-4 relative">
                <button
                  onClick={handleCloseModal}
                  className="absolute top-0 left-0 text-[#214E78] hover:text-red-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 bg-[#214E78] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>

                <p className="text-lg font-semibold text-[#214E78]">
                  حدث خطأ أثناء تأكيد الحجز
                </p>
                <p className="text-gray-600 mt-2">
                  يرجى المحاولة لاحقاً أو التواصل مع الدعم.
                </p>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step == 1 && paymentStatus === "idle" && (
            <form className="text-[#214E78] font-bold flex flex-col justify-between items-center h-fit gap-7 text-center mt-[60px] px-4 sm:px-8 md:px-12">
              <label className="text-sm sm:text-base md:text-lg">
                البريد الالكتروني
              </label>
              <input
                name="email"
                type="text"
                placeholder="ادخل البريد الالكتروني"
                onChange={handleChange}
                value={formData.email}
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
                  onClick={handleNext}
                  type="button"
                  className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                >
                  التالي
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {step == 2 && paymentStatus === "idle" && (
            <>
              <AdminDateTimePickerReserve<ReservationFormData>
                formData={formData}
                setFormData={setFormData}
                type="reservation"
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
              />
              {message ? (
                <p className="text-xs p-0 m-0 text-red-500 font-bold mt-[20px]">
                  {message}
                </p>
              ) : (
                ""
              )}
              <div dir="ltr" className="flex justify-center">
                <div className="overflow-visible mr-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handleNext}
                  >
                    التالي
                  </button>
                </div>
                <div className="overflow-visible ml-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handlePrev}
                  >
                    السابق
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step == 3 && paymentStatus === "idle" && (
            <div className="flex flex-col gap-6 mt-7">
              <div className="flex flex-col gap-2">
                {/* Online */}
                {data?.listen_status && (
                  <section className="flex flex-col gap-2">
                    <div className="flex justify-between w-full items-center">
                      <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-2 rounded-2xl text-white">
                        <input
                          type="checkbox"
                          checked={formData.type === "online"}
                          onChange={() => handleCheckbox("online")}
                          className="hidden peer"
                        />
                        <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white peer-checked:bg-white transition-all">
                          <span className="w-2.5 h-2.5 bg-[#214E78] rounded-full opacity-0 peer-checked:opacity-100 transition-all"></span>
                        </span>
                        <span className="font-bold">استماع / Listen</span>
                      </label>

                      <span className="font-bold text-[#214E78] flex items-center">
                        <p className="text-white bg-[#214E78] py-1 px-4 rounded-2xl ml-3 w-24 text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                          {data?.listen_price}
                        </p>
                        ريال
                      </span>
                    </div>

                    <p className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3  rounded-lg h-[5rem]">
                      {data?.listen_text}
                    </p>
                  </section>
                )}

                {/* In Person */}
                {data?.listen_meet_status && (
                  <section className="flex flex-col gap-2">
                    <div className="flex justify-between w-full items-center">
                      <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-2 rounded-2xl text-white">
                        <input
                          type="checkbox"
                          checked={formData.type === "inPerson"}
                          onChange={() => handleCheckbox("inPerson")}
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
                        <p className="text-white bg-[#214E78] py-1 px-4 rounded-2xl ml-3 w-24 text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                          {data?.listen_meet_price}
                        </p>
                        ريال
                      </span>
                    </div>

                    <p className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3 rounded-lg h-[5rem]">
                      {data?.listen_meet_text}
                    </p>
                  </section>
                )}
              </div>
              {message ? (
                <p className="text-xs p-0 m-0 text-red-500">{message}</p>
              ) : (
                ""
              )}
              <div dir="ltr" className="flex justify-center">
                <div className="overflow-visible mr-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handleNext}
                  >
                    التالي
                  </button>
                </div>
                <div className="overflow-visible ml-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handlePrev}
                  >
                    السابق
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step == 4 && paymentStatus === "idle" && (
            <div className="flex flex-col gap-6 mt-7">
              <div className="flex flex-col gap-10">
                <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-3 rounded-2xl text-white">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethod === "banktransfer"}
                    onChange={() => handleCheckboxPayment("banktransfer")}
                    className="hidden peer"
                  />
                  <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white peer-checked:bg-white transition-all">
                    <span className="w-2.5 h-2.5 bg-[#214E78] rounded-full opacity-0 peer-checked:opacity-100 transition-all"></span>
                  </span>
                  <span className="font-bold">تحويل بنكي / Bank Transfer</span>
                </label>

                <label className="flex items-center gap-7 cursor-pointer w-[75%] bg-[#214E78] px-6 py-3 rounded-2xl text-white">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethod === "cash"}
                    onChange={() => handleCheckboxPayment("cash")}
                    className="hidden peer"
                  />
                  <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white peer-checked:bg-white transition-all">
                    <span className="w-2.5 h-2.5 bg-[#214E78] rounded-full opacity-0 peer-checked:opacity-100 transition-all"></span>
                  </span>
                  <span className="font-bold">نقدا / Cash</span>
                </label>
              </div>
              {message ? (
                <p className="text-xs p-0 m-0 text-red-500">{message}</p>
              ) : (
                ""
              )}
              <div dir="ltr" className="flex justify-center">
                <div className="overflow-visible mr-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handleSubmit}
                  >
                    حجز
                  </button>
                </div>
                <div className="overflow-visible ml-auto mt-[30px]">
                  <button
                    type="button"
                    className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                    onClick={handlePrev}
                  >
                    السابق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ContentContainer>
    </>
  );
}
