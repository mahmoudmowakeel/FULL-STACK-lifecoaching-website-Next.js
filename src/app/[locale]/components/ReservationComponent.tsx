"use client";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReservationFormData } from "@/lib/types/freeTrials";
import PaymentModal from "./PaymentModal";
import DateTimePickerReserve from "./DateTimePicker_reserve";
import { NotesModal } from "./NotesModal";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook
import {
  ApiResponse,
  ListeningOptions,
} from "@/app/admin/dashboard/listen-meet/page";

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function ReservationButton({ text }: { text: string }) {
  const [step, setStep] = useState<number>(1);
  const locale = useLocale(); // Get the current locale from next-intl
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [message, setMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const [formData, setFormData] = useState<ReservationFormData>({
    email: "",
    date_time: null,
    type: "",
    amount: "200",
    paymentMethod: "gateway",
    payment_bill: "no bill",
  });

  const t = useTranslations("homePage");
  const reservationT = useTranslations("reservation"); // Translations for reservation
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<{
    beforeAccept: string;
    firstEntry: string;
  }>({
    beforeAccept: "",
    firstEntry: "",
  });
  const [pMessage, setPmessage] = useState<{
    complete_reservation: string;
  }>({
    complete_reservation: "",
  });

  async function getNotes() {
    try {
      const response = await fetch("/api/get-additional-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const before_accept = data.data.find(
        (el: ElementType) => el.type == "before_accept"
      );
      const first_entry = data.data.find(
        (el: ElementType) => el.type == "first_entry"
      );

      setNotes({
        beforeAccept:
          locale == "ar" ? before_accept?.text_ar : before_accept?.text_en,
        firstEntry:
          locale == "ar" ? first_entry?.text_ar : first_entry?.text_en,
      });

      return;
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }
  async function getPmessages() {
    try {
      const response = await fetch("/api/get-final-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const afterReserve = data.data.find(
        (el: ElementType) => el.type == "reservation"
      );

      setPmessage({
        complete_reservation:
          locale == "ar" ? afterReserve?.text_ar : afterReserve?.text_en,
      });

      return;
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }

  // Calculate amount based on reservation type
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

  const handleSubmit = async () => {
    if (!formData.type) {
      setMessage(reservationT("type_required"));
      return;
    }
    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Close payment modal first
    setShowPaymentModal(false);

    // Show reservation confirmation in the main modal
    setPaymentStatus("processing");
    setIsProcessingPayment(true);

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

      // 1️⃣ Create reservation in DB
      const reservationResponse = await fetch("/api/create-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_bill: paymentIntentId,
          email: formData.email,
          // date_time: formData.date_time,
          date_time: formattedDate,
          type: formData.type,
          amount: getAmount(),
          status: "pending",
          paymentMethod: formData.paymentMethod,
        }),
      });

      if (!reservationResponse.ok) {
        throw new Error("❌ Failed to save reservation");
      }

      // ✅ Reservation saved successfully
      setPaymentStatus("success");
      setMessage("تم تأكيد الحجز بنجاح! جارٍ إنشاء الاجتماع...");

      // 2️⃣ Create Google Meet event
      const startTime = new Date(formData.date_time!);
      const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

      const meetingResponse = await fetch("/api/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime,
          endTime,
          summary: "حجز جديد",
          description: `حجز جديد للعميل ${formData.email}`,
        }),
      });

      const meetingData = await meetingResponse.json();

      if (!meetingResponse.ok || !meetingData.success) {
        console.error("⚠️ Meeting creation failed:", meetingData.error);
        throw new Error("فشل في إنشاء اجتماع Google Meet.");
      }

      console.log("✅ Meeting created:", meetingData);
      function formatLocalDateTime(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
      }

      // 3️⃣ Send email with meeting details
      const emailResponse = await fetch("/api/send-meeting-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.email || "العميل",
          customerEmail: formData.email,
          meetingDetails: {
            startTime: formatLocalDateTime(startTime),
            endTime: formatLocalDateTime(endTime),
            summary: formData.type,
            meetLink: meetingData.hangoutLink,
            eventLink: meetingData.eventLink,
          },
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok || !emailResult.success) {
        console.error("⚠️ Email send failed:", emailResult.error);
        throw new Error("تم الحجز ولكن حدث خطأ أثناء إرسال البريد الإلكتروني.");
      }

      console.log("📧 Email sent successfully:", emailResult);
      setMessage(
        "✅ تم تأكيد الحجز وإرسال تفاصيل الاجتماع إلى بريدك الإلكتروني."
      );

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

      setOpen(false);
      const date = new Date(new Date(formData.date_time as string));
      const formatted = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      setNote(
        pMessage.complete_reservation
          .replace(`(اسم العميل)`, formData.email.split("@")[0])
          .replace("تاريخ و يوم", formatted!)
          .replace("ووقت", "")
      );
      setNotesOpen(true);
      setLoading(false);

      // 4️⃣ Reset form after short delay
      setTimeout(() => {
        setOpen(false);
        setStep(1);
        setPaymentStatus("idle");
        setFormData({
          email: "",
          date_time: null,
          type: "",
          amount: "200",
          paymentMethod: "gateway",
          payment_bill: "no bill",
        });
        setMessage("");
        setFormOtp("");
        setOtp("");
      }, 3000);
    } catch (error) {
      console.error("❌ Error in booking process:", error);
      setPaymentStatus("error");
      setMessage(
        "تم الدفع بنجاح ولكن حدث خطأ أثناء إنشاء الاجتماع أو إرسال البريد الإلكتروني."
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentModal(false);
    setMessage(`خطأ في الدفع: ${error}`);
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step == 1) {
      if (!formData.email) {
        setMessage(reservationT("email_required"));
        return;
      }
      if (otp != formOtp) {
        setMessage(reservationT("otp_wrong"));
        return;
      }
      setLoading(true);
      const res = await fetch("/api/check-free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (res.status === 404) {
        setOpen(false);
        setNote(notes.firstEntry);
        setNotesOpen(true);
        setLoading(false);
        return; // stop execution
      }
      if (res.status === 403) {
        setOpen(false);
        setNote(reservationT("another_reservation"));
        setNotesOpen(true);
        setLoading(false);
        return; // stop execution
      }
      if (res.status === 409) {
        setOpen(false);
        setNote(notes.beforeAccept);
        setNotesOpen(true);
        setLoading(false);
        return; // stop execution
      }
      setLoading(false);
    }
    if (step == 2) {
      if (!formData.date_time) {
        setMessage(reservationT("date_time_req"));
        return;
      }
    }
    setMessage("");
    setStep((step) => step + 1);
  }

  function handlePrev(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setStep((step) => step - 1);
  }

  const handleCheckbox = (type: string) => {
    setFormData((prev: ReservationFormData) => ({
      ...prev,
      type: prev.type === type ? "" : type,
    }));
  };

  async function handelVerfication(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(reservationT("otp_sent"));
      setOtp(data.code);
    } else {
      setMessage("خطأ في ارسال كود التحقق برجاء المحاولة مره اخري.");
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
      paymentMethod: "gateway",
      payment_bill: "no bill",
    });
    setMessage("");
    setFormOtp("");
    setOtp("");
    setNotesOpen(false);
    setNote("");
  };
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
  useEffect(() => {
    getNotes();
    getPmessages();
    fetcTypehData();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full w-full sm:w-auto"
      >
        <section className="w-full max-w-sm mx-auto h-full text-sm sm:text-[12px] bg-[url('/Images/bg.jpg')] bg-cover bg-center rounded-2xl cursor-pointer">
          <div className="bg-[#214e78b2] hover:bg-[#ffffff7e] hover:font-extrabold hover:text-[#214e78b2] transition duration-300 h-full w-full rounded-2xl text-white flex flex-col justify-center items-center gap-3 p-1 sm:px-1">
            <div className=" md:p-1 flex flex-col gap-4 sm:gap-6 w-full">
              <h1 className="text-[12px] sm:text-[14px] font-bold text-center">
                {t("reservation")}
              </h1>
              <p
                className={`w-full m-h-xs max-w-xs mx-auto leading-6 sm:leading-7 font-semibold text-center ${
                  locale == "ar"
                    ? "text-[10px] sm:text-[12px]"
                    : "text-[10px] sm:text-[8px]"
                } `}
              >
                {text}
              </p>
            </div>
          </div>
        </section>
      </button>

      <NotesModal isOpen={notesOpen} onClose={handleCloseModal}>
        <p>{note}</p>
      </NotesModal>

      <Modal isOpen={open} onClose={handleCloseModal}>
        <button
          onClick={handleCloseModal}
          className={`absolute top-3 ${
            locale == "ar" ? "left-3" : "right-3"
          }  text-[#214E78] font-bold hover:text-gray-700`}
          disabled={paymentStatus === "processing"}
        >
          <X className="w-5 h-5" />
        </button>
        <h2
          className={`text-sm sm:text-lg  font-semibold mb-4 text-[#214E78] ${
            locale == "ar" ? "text-right" : "text-left"
          } `}
        >
          {reservationT("title")}
        </h2>

        {/* 🔵 Reservation Status Overlays */}
        {paymentStatus === "processing" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-[#214E78]">
                {locale == "ar"
                  ? "جاري تأكيد الحجز..."
                  : "Complete Reservation In Proccess.."}
              </p>
              <p className="text-gray-600 mt-2">{reservationT("title")}</p>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4">
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
                {locale == "ar"
                  ? "تم تأكيد الحجز بنجاح!"
                  : "Reservation completed successfully!"}
              </p>
              <p className="text-gray-600 mt-2">سيتم إغلاق النافذة تلقائياً</p>
            </div>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-[#A4D3DD] p-6 rounded-lg text-center max-w-sm mx-4 relative">
              {/* ❌ Close Button */}
              <button
                onClick={() => {
                  setPaymentStatus("idle");
                  setMessage("");
                }}
                className="absolute top-3 left-3 text-[#214E78] hover:text-red-700 cursor-pointer"
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
                {reservationT("reserve_error")}
              </p>
              <p className="text-gray-600 mt-2">{reservationT("try_again")}</p>
            </div>
          </div>
        )}

        {step == 1 && paymentStatus === "idle" && (
          <form className="text-[#214E78] font-bold flex flex-col justify-between items-center h-fit gap-7 text-center mt-[60px] px-4 sm:px-8 md:px-12">
            <label className="text-sm sm:text-base md:text-md">
              {reservationT("email")}
            </label>
            <input
              name="email"
              type="text"
              placeholder={reservationT("email_place")}
              onChange={handleChange}
              value={formData.email}
              className="w-[60%] sm:w-[80%] md:w-[75%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
            />
            <label className="text-sm sm:text-base md:text-md">
              {reservationT("verify_code")}
            </label>
            <div className="w-full relative">
              <input
                type="text"
                placeholder={reservationT("verify_code_place")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormOtp(e.target.value)
                }
                value={formOtp}
                className="w-[60%] sm:w-[80%] md:w-[75%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
              />
              <button
                type="submit"
                className="absolute left-[6rem] sm:left-[3.5rem] md:left-[4rem] top-2 sm:top-1 text-[#214E78] text-[10px] sm:text-xs bg-[#A4D3DD] py-1 px-2 sm:py-2 sm:px-3 rounded-lg cursor-pointer"
                onClick={handelVerfication}
              >
                {reservationT("verifing")}
              </button>
            </div>
            {message ? (
              <p className="text-xs p-0 m-0 text-[#214E78]">{message}</p>
            ) : (
              ""
            )}
            <div className="overflow-visible mr-auto mt-[30px]">
              <button
                onClick={handleNext}
                type="submit"
                className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
              >
                {loading
                  ? locale == "ar"
                    ? "تحقق..."
                    : "Veryfing"
                  : reservationT("next")}
              </button>
            </div>
          </form>
        )}

        {step == 2 && paymentStatus === "idle" && (
          <>
            <DateTimePickerReserve<ReservationFormData>
              formData={formData}
              setFormData={setFormData}
              type="reservation"
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
            />
            {message ? (
              <p className="text-xs p-0 m-0 text-[#214E78] font-bold mt-[20px]">
                {message}
              </p>
            ) : (
              ""
            )}
            <div dir="ltr" className="flex justify-center">
              <div className="overflow-visible mr-auto mt-[30px]">
                <button
                  type="submit"
                  className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                  onClick={handleNext}
                >
                  {reservationT("next")}
                </button>
              </div>
              <div className="overflow-visible ml-auto mt-[30px]">
                <button
                  type="submit"
                  className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                  onClick={handlePrev}
                >
                  {reservationT("previous")}
                </button>
              </div>
            </div>
          </>
        )}

        {step == 3 && paymentStatus === "idle" && (
          <div className="flex flex-col gap-6 mt-7">
            <div className="flex flex-col gap-2">
              {typeData?.listen_status && (
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
                      <span className="font-bold">
                        {reservationT("listen")}
                      </span>
                    </label>

                    <span className="font-bold text-[#214E78] flex items-center">
                      <span className="text-white bg-[#214E78] py-1 px-2 rounded-2xl ml-3 w-fit text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                        {typeData?.listen_price}
                      </span>
                      {reservationT("currency")}
                    </span>
                  </div>
                  <p className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3 rounded-lg h-[5rem]">
                    {typeData?.listen_text}
                  </p>
                </section>
              )}

              {/* 🔹 استماع ولقاء */}
              {typeData?.listen_meet_status ? (
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
                        {reservationT("listen_meet")}
                      </span>
                    </label>

                    <span className="font-bold text-[#214E78] flex items-center">
                      <span className="text-white bg-[#214E78] py-1 px-2 rounded-2xl ml-3 w-fit text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                        {typeData?.listen_meet_price}
                      </span>
                      {reservationT("currency")}
                    </span>
                  </div>
                  <p className="text-right text-sm w-[75%] text-[#214E78] py-2 px-3 rounded-lg h-[5rem]">
                    {typeData?.listen_meet_text}
                  </p>
                </section>
              ) : (
                <section className="flex flex-col gap-2 cursor-not-allowed">
                  <div className="flex justify-between w-full items-center">
                    <label className="flex items-center gap-7 w-[75%] bg-gray-400 cursor-not-allowed px-6 py-2 rounded-2xl text-white">
                      <input
                        type="checkbox"
                        disabled
                        checked={formData.type === "inPerson"}
                        onChange={() => handleCheckbox("inPerson")}
                        className="hidden peer cursor-not-allowed"
                      />
                      <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white peer-checked:bg-white transition-all">
                        <span className="w-2.5 h-2.5 bg-gray-400 rounded-full opacity-0 peer-checked:opacity-100 transition-all"></span>
                      </span>
                      <span className="font-bold">
                        {reservationT("listen_meet")}
                      </span>
                    </label>

                    <span className="font-bold text-gray-400 flex items-center">
                      <span className="text-white bg-gray-400 py-1 px-2 rounded-2xl ml-3 w-fit text-center appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                        {typeData?.listen_meet_price}
                      </span>
                      {reservationT("currency")}
                    </span>
                  </div>
                  <p className="text-right text-sm w-[75%] text-gray-400 py-2 px-3 rounded-lg h-[5rem]">
                    {typeData?.listen_meet_text}
                  </p>
                </section>
              )}
            </div>
            {message ? (
              <p className="text-md p-0 m-0 text-[#214E78]">{message}</p>
            ) : (
              ""
            )}
            <div dir="ltr" className="flex justify-center">
              <div className="overflow-visible mr-auto mt-[30px]">
                <button
                  type="submit"
                  className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                  onClick={handleSubmit}
                >
                  {reservationT("pay")}
                </button>
              </div>
              <div className="overflow-visible ml-auto mt-[30px]">
                <button
                  type="submit"
                  className="sticky bottom-6 left-6 bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer"
                  onClick={handlePrev}
                >
                  {reservationT("previous")}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        formData={formData}
        amount={getAmount()}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </>
  );
}
