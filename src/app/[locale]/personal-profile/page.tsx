"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { NotesModal } from "../components/NotesModal";
// import { Modal as AdminModal } from "@/app/admin/dashboard/_components/Modal"; // ✅ Import Admin modal
import NormalButton from "@/app/admin/dashboard/_UI/NormalButton";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { AdminModal } from "@/app/admin/dashboard/_components/ModalAdmin";
import DateTimePickerReserve from "../components/DateTimePicker_reserve";
import { ReservationFormData } from "@/lib/types/freeTrials";

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}
type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

interface Reservation {
  id: string;
  date_time: string;
  type: string;
  paymentMethod: string;
  invoice_number: string;
  invoice_pdf: string;
  amount: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  is_edited?: boolean;
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("profilePage");
  const locale = useLocale();
  const emailParam = searchParams.get("email");
  const nameParam = searchParams.get("name");
  const phoneParam = searchParams.get("phone");

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentBookings, setCurrentBookings] = useState<Reservation[]>([]);
  const [previousBookings, setPreviousBookings] = useState<Reservation[]>([]);
  const [email, setEmail] = useState<string | null>(emailParam);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showNoteModal, setShowNoteModal] = useState(false); // ✅ Notes modal
  const [showAdminModal, setShowAdminModal] = useState(false); // ✅ Admin modal
  const [editBefore, setEditBefore] = useState(false);

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

  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const [newDateTime, setNewDateTime] = useState<string>("");
  const [notes, setNotes] = useState<{
    edit: string;
  }>({
    edit: "",
  });

  // ✅ Get email from localStorage if not in params
  useEffect(() => {
    const storedEmail =
      typeof window !== "undefined" ? localStorage.getItem("email") : null;
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/ar/home");
    }
  }, [router]);

  async function getNotes() {
    try {
      const response = await fetch("/api/get-additional-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const edit = data.data.find(
        (el: ElementType) => el.type == "edit-reserve"
      );

      setNotes({
        edit: locale == "ar" ? edit?.text_ar : edit?.text_en,
      });
    } catch (error) {
      return false;
    }
  }

  useEffect(() => {
    getNotes();
  }, []);

  // ✅ Fetch reservations
  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/get-reservations");
      const data = await res.json();

      if (data.success && email) {
        const allUserReservations = data.data.filter(
          (r: Reservation) => r.email === email
        );

        if (allUserReservations.length > 0 && !nameParam && !phoneParam) {
          const { name, phone } = allUserReservations[0];
          setUserInfo({ name, phone, email });
        }

        const pending = allUserReservations
          .filter((r: Reservation) => r.status === "pending")
          .sort(
            (a: Reservation, b: Reservation) => parseInt(a.id) - parseInt(b.id)
          );

        if (pending && pending[0]?.is_edited) {
          setEditBefore(true);
        }

        const completed = allUserReservations
          .filter((r: Reservation) => r.status === "completed")
          .sort(
            (a: Reservation, b: Reservation) => parseInt(a.id) - parseInt(b.id)
          );

        setCurrentBookings(pending);
        setPreviousBookings(completed);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
    }
  };

  useEffect(() => {
    if (email) fetchReservations();
  }, [email]);

  useEffect(() => {
    if (email && (nameParam || phoneParam)) {
      setUserInfo({
        name: nameParam || "غير محدد",
        phone: phoneParam || "غير محدد",
        email,
      });
    }
    setIsLoading(false);
  }, [email, nameParam, phoneParam]);

  // ✅ Save changes (modal)
  const handleSave = async () => {
    let formattedDate = formData?.date_time;
    if (formattedDate) {
      const date = new Date(formattedDate);
      formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
    if (!selectedReservation) return;
    try {
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedReservation.email,
          id: selectedReservation.id,
          date_time: formattedDate,
          is_edited: true,
        }),
      });

      const data = await res.json();

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

      if (data.success) {
        await fetch("/api/send-general-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: selectedReservation.name,
            customerEmail: selectedReservation.email,
            type: "edit",
            date_time: formattedDate,
          }),
        });
        toast.success(t("updateSuccess"));
        setShowAdminModal(false);
        setSelectedReservation(null);
        fetchReservations();
      } else {
        toast.error(t("updateFail"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("updateError"));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("email");
    }
    router.push("/ar/home");
  };

  if (isLoading) return <div>Loading...</div>;

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat text-[#214E78] mt-[80px] flex items-center justify-center px-4">
        <div className="text-center bg-white/70 p-6 rounded-xl shadow-md max-w-sm w-full">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            {t("noUserData")}
          </h2>
          <p className="text-base md:text-lg">{t("loginFirst")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat text-[#214E78] mt-[80px]"
      dir="rtl"
    >
      {/* 🧩 Notes Modal */}
      <NotesModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          if (!editBefore) setShowAdminModal(true);
        }}
      >
        <div className="text-center space-y-4">
          <p className="font-bold text-[#214E78] leading-relaxed text-sm">
            {editBefore ? t("editDisabled") : notes.edit}
          </p>
        </div>
      </NotesModal>

      {/* 🧩 Admin Modal for Editing */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      >
        <div className="text-center space-y-6 text-[#214E78]">
          <div className="flex flex-col items-center ">
            <DateTimePickerReserve<ReservationFormData>
              formData={formData}
              setFormData={setFormData}
              type="reservation"
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
            />
          </div>

          <div className="flex justify-between gap-3.5 mx-auto w-[50%]">
            <button
              className="mt-4 w-[50%] text-[#214E78] bg-white p-1 rounded-md cursor-pointer"
              onClick={handleSave}
            >
              حفظ <br /> Save
            </button>
            <button
              className="mt-4 w-[50%] bg-[#214E78] text-white p-1 rounded-md cursor-pointer"
              onClick={() => setShowAdminModal(false)}
            >
              الغاء / cancel
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Header */}
      <header className="flex flex-row md:flex-row justify-between items-center bg-[#214E78] text-[#A4D3DD] px-4 py-4 text-sm md:text-md gap-2 md:gap-0">
        <div className="font-bold text-white border-l md:border-l px-2">
          {t("profilePage2")}
        </div>

        <div className="text-white flex flex-row flex-wrap justify-between items-center gap-1 md:gap-4 text-xs md:text-sm w-full md:w-auto">
          <span>
            {t("email")}: {userInfo?.email}
          </span>
          <span>
            {t("phone")}: {userInfo?.phone}
          </span>
          <span>
            {t("name")}: {userInfo?.name}
          </span>

          <button
            onClick={handleLogout}
            className="bg-[#A4D3DD] text-[#214E78] px-3 py-1 rounded-md hover:bg-[#8abfcc] transition text-xs font-bold"
          >
            {locale === "ar" ? "خروج" : "Logout"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-start pt-8 pb-20 px-2">
        {/* Current Bookings */}
        <section className="w-full md:w-[80%] text-center mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t("bookings")}</h2>
            {currentBookings.length > 0 && (
              <button
                onClick={() => {
                  setShowNoteModal(true);
                  setSelectedReservation(currentBookings[0]);
                  setNewDateTime(
                    new Date(currentBookings[0].date_time)
                      .toISOString()
                      .slice(0, 16)
                  );
                }}
                className="bg-[#214E78] text-white px-6 py-2 rounded-md hover:bg-[#1b3f60] transition text-sm font-semibold"
              >
                {t("edit")}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-[#A4D3DD]/90 rounded-lg py-3 px-3 font-semibold text-[#214E78] overflow-x-auto shadow-md">
            <div className="hidden sm:grid sm:grid-cols-5 gap-2 text-xs md:text-sm font-bold mb-3">
              <span>{t("dateTime")}</span>
              <span>{t("type")}</span>
              <span>{t("paymentMethod")}</span>
              <span>{t("invoiceNumber")}</span>
              <span>{t("price")}</span>
            </div>

            {currentBookings.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-[#A4D3DD] py-2 px-2 rounded-lg text-xs md:text-sm shadow-sm"
              >
                <span dir="ltr">
                  {new Date(b.date_time)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}
                </span>
                <span>{b.type === "inPerson" ? "استماع ولقاء" : "استماع"}</span>
                <span>
                  {b.paymentMethod === "gateway"
                    ? "بوابة دفع"
                    : b.paymentMethod === "banktransfer"
                    ? "تحويل بنكي"
                    : "نقدا"}
                </span>
                <span>{b.invoice_number}</span>
                <span>
                  {(Number(b.amount) / 100).toFixed(2)}{" "}
                  {locale == "ar" ? "درهم" : "AED"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Previous Bookings */}
        <section className="w-full md:w-[80%] text-center">
          <h2 className="text-lg font-bold mb-4">الحجوزات السابقة</h2>
          <div className="bg-[#A4D3DD]/90 rounded-lg py-3 px-3 font-semibold text-[#214E78] overflow-x-auto shadow-md">
            <div className="hidden sm:grid sm:grid-cols-5 gap-2 text-xs md:text-sm font-bold mb-3">
              <span>التاريخ والوقت</span>
              <span>النوع</span>
              <span>طريقة الدفع</span>
              <span>رقم الفاتورة</span>
              <span>السعر</span>
            </div>

            {previousBookings.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-[#A4D3DD] py-2 px-2 rounded-lg text-xs md:text-sm shadow-sm"
              >
                <span dir="ltr">
                  {new Date(b.date_time)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}
                </span>
                <span>{b.type === "inPerson" ? "استماع ولقاء" : "استماع"}</span>
                <span>
                  {b.paymentMethod === "gateway"
                    ? "بوابة دفع"
                    : b.paymentMethod === "banktransfer"
                    ? "تحويل بنكي"
                    : "نقدا"}
                </span>
                <span>{b.invoice_number}</span>
                <span>
                  {" "}
                  {(Number(b.amount) / 100).toFixed(2)}{" "}
                  {locale == "ar" ? "درهم" : "AED"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
