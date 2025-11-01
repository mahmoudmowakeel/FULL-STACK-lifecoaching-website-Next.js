"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { NotesModal } from "../components/NotesModal";
import NormalButton from "@/app/admin/dashboard/_UI/NormalButton";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

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

  const [editing, setEditing] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newDateTime, setNewDateTime] = useState<string>("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [editBefore, setEditBefore] = useState<boolean>(false);

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

  // ✅ Fetch reservations and user info
  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/get-reservations");
      const data = await res.json();

      if (data.success && email) {
        const allUserReservations = data.data.filter(
          (r: Reservation) => r.email === email
        );

        // ✅ Get user info (from first reservation)
        if (allUserReservations.length > 0 && !nameParam && !phoneParam) {
          const { name, phone } = allUserReservations[0];
          setUserInfo({ name, phone, email });
        }

        const pending = allUserReservations
          .filter((r: Reservation) => r.status === "pending")
          .sort((a: Reservation, b: Reservation) => parseInt(a.id) - parseInt(b.id));

        if (pending && pending[0]?.is_edited) {
          setEditBefore(true);
        }

        const completed = allUserReservations
          .filter((r: Reservation) => r.status === "completed")
          .sort((a: Reservation, b: Reservation) => parseInt(a.id) - parseInt(b.id));

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

  // ✅ Save changes
  const handleSave = async () => {
    if (!selectedReservation) return;
    try {
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedReservation.email,
          id: selectedReservation.id,
          date_time: newDateTime,
          is_edited: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetch("/api/send-general-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: selectedReservation.name,
            customerEmail: selectedReservation.email,
            type: "edit",
            date_time: newDateTime,
          }),
        });
        toast.success(t("updateSuccess"));
        setEditing(false);
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

  // ✅ Logout handler
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
      {/* Modal */}
      <NotesModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (!editBefore) {
            setEditing(true);
          }
        }}
      >
        <div className="text-center space-y-4">
          <p className="font-bold text-[#214E78] leading-relaxed text-sm">
            {editBefore ? t("editDisabled") : t("editWarning")}
          </p>
        </div>
      </NotesModal>

      {/* Header */}
      <header className="flex flex-row md:flex-row justify-between items-center md:items-center bg-[#214E78] text-[#A4D3DD] px-4 py-4 text-sm md:text-md gap-2 md:gap-0">
        <div className="font-bold text-white border-l md:border-l px-2">
          {t("profilePage2")}
        </div>

        <div className="text-white flex flex-row md:flex-row flex-wrap justify-between items-center gap-1 md:gap-4 text-xs md:text-sm w-full md:w-auto">
          <span>
            {t("email")}: {userInfo?.email}
          </span>
          <span>
            {t("phone")} : {userInfo?.phone}
          </span>
          <span>
            {t("name")}: {userInfo?.name}
          </span>

          <button
            onClick={handleLogout}
            className="bg-[#A4D3DD] text-[#214E78] px-3 py-1 rounded-md hover:bg-[#8abfcc] transition text-xs font-bold"
          >
            {locale === "ar" ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-start pt-8 pb-20 px-2">
        {/* Current Bookings */}
        <section className="w-full md:w-[80%] text-center mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t("bookings")}</h2>
            {!editing && currentBookings.length > 0 && (
              <button
                onClick={() => {
                  setShowModal(true);
                  if (editBefore) return;
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
                {editing && selectedReservation?.id === b.id ? (
                  <input
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    className="rounded-md px-2 py-1 border border-[#214E78]"
                  />
                ) : (
                  <span dir="ltr">
                    {new Date(b.date_time)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")}
                  </span>
                )}
                <span>{b.type === "inPerson" ? "استماع ولقاء" : "استماع"}</span>
                <span>
                  {b.paymentMethod === "gateway"
                    ? "بوابة دفع"
                    : b.paymentMethod === "banktransfer"
                    ? "تحويل بنكي"
                    : "نقدا"}
                </span>
                <span>{b.invoice_number}</span>
                <span>{b.amount}</span>
              </div>
            ))}
          </div>

          {editing && !editBefore && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleSave}
                className="bg-[#214E78] text-white px-6 py-2 rounded-md hover:bg-[#1b3f60] transition text-sm font-semibold"
              >
                {t("save")}
              </button>
            </div>
          )}
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
                <span>{b.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
