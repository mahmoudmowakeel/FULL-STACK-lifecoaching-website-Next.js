"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import FreeTrialButton from "../components/FreeTrialComponent";
import ReservationButton from "../components/ReservationComponent";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotesModal } from "../components/NotesModal";
import { useLocale } from "next-intl";

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("homePage");
  const router = useRouter();
  const [hirePopUp, setHirePopUp] = useState(false);
  const [hiringNote, setHiringNote] = useState("");
  const [freeText, setFreeText] = useState("");
  const [reserveText, setReserveText] = useState("");

  async function getText() {
    try {
      const response = await fetch("/api/get-page-notes");
      const data = await response.json();

      if (!data.success) return false;

      const freeData = data.data.find((el: ElementType) => el.type == "free_trials");
      const reserveData = data.data.find((el: ElementType) => el.type == "reservations");
      setFreeText(locale == "ar" ? freeData.text_ar : freeData.text_en);
      setReserveText(locale == "ar" ? reserveData.text_ar : reserveData.text_en);
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }

  async function checkHiringStatus() {
    try {
      const response = await fetch("/api/check-hiring-status");
      const data = await response.json();

      if (!data.success) return false;

      if (data.hiringOpen) {
        setHirePopUp(false);
        router.push("hiring");
      } else {
        setHiringNote(data.hiring_text);
        setHirePopUp(true);
      }

      return data.hiringOpen;
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }

  useEffect(() => {
    getText();
  }, []);

  return (
    <>
      {hirePopUp && (
        <NotesModal isOpen={hirePopUp} onClose={() => setHirePopUp(false)}>
          {hiringNote}
        </NotesModal>
      )}

      {/* ✅ Grid-based Layout */}
      <div
        className="grid min-h-[calc(100vh-100px)] bg-white mt-[88px]"
        style={{
          gridTemplateRows: "1fr 0.5fr 1fr 0.1fr 0.1fr",
        }}
      >
        {/* (1) Background Image */}
        <div className="relative w-full h-full">
          <Image
            src="/Images/bg.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* (2) Welcome Text */}
        <div className="bg-[#A4D3DD] w-full h-full text-center text-[#214E78] font-semibold flex items-center justify-center px-4 py-6">
          <p
            className={`${
              locale == "ar"
                ? "text-[0.6rem] sm:text-[0.7rem] md:text-[0.8rem]"
                : "text-[0.5rem] sm:text-[0.7rem] md:text-[0.6rem]"
            } leading-relaxed max-w-[350px]`}
          >
            {t("welcome_text")}
          </p>
        </div>

        {/* (3) Buttons Section */}
        <div className="bg-[#214E78] w-full h-full py-10 md:py-2 flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">
          <FreeTrialButton text={freeText} />
          <ReservationButton text={reserveText} />
        </div>

        {/* (4) Contact & Social Section */}
        <div className="flex flex-col md:grid md:grid-cols-3 justify-center items-center gap-6 md:gap-0 py-2 px-4 text-[#214E78] font-bold text-center h-full">
          {/* Hiring Link */}
          <div className="flex justify-center md:justify-start">
            <button
              className="cursor-pointer text-[#214E78] px-4 py-2 rounded-lg transition-all text-sm md:text-xs font-semibold"
              onClick={checkHiringStatus}
            >
              {t("hiring")}
            </button>
          </div>

          {/* Social Media Icons */}
          <section className="flex justify-center gap-4">
            <Link
              href="https://youtube.com/@istifhamcompany?si=BwT1aeuZxnVWSNZp"
              target="_blank"
            >
              <Image
                src="/Images/youtube.svg"
                width={30}
                height={30}
                alt="youtube"
                className="bg-[#214E78] p-2 rounded-full"
              />
            </Link>
            <Link
              href="https://x.com/Istifhamcompany?t=n92RC3xy9YMgZaL4jM4u2Q&s=08"
              target="_blank"
            >
              <Image
                src="/Images/x_social.svg"
                width={30}
                height={30}
                alt="x"
                className="bg-[#214E78] p-2 rounded-full"
              />
            </Link>
            <Link
              href="https://www.snapchat.com/add/istifhamcompany?share_id=drI6FXWQqvo&locale=ar-AE"
              target="_blank"
            >
              <Image
                src="/Images/snapchat.svg"
                width={30}
                height={30}
                alt="snapchat"
                className="bg-[#214E78] p-2 rounded-full"
              />
            </Link>
          </section>

          {/* Contact Info */}
          <section className="flex flex-col gap-2 items-center md:items-end text-xs sm:text-xs">
            <div dir="ltr" className="flex items-center gap-2">
              <Image
                src="/Images/email.svg"
                width={24}
                height={24}
                alt="email"
                className="bg-[#214E78] p-1.5 rounded-full"
              />
              <a
                href="mailto:Istifhamcompany@gmail.com"
                className="hover:underline"
              >
                Istifhamcompany@gmail.com
              </a>
            </div>

            <div dir="ltr" className="flex items-center gap-2">
              <a href="tel:+966545938783">
                <Image
                  src="/Images/phone.svg"
                  width={24}
                  height={24}
                  alt="phone"
                  className="bg-[#214E78] p-1.5 rounded-full"
                />
              </a>

              <a
                href="https://wa.me/966545938783"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/Images/whatsapp.svg"
                  width={24}
                  height={24}
                  alt="whatsapp"
                  className="bg-[#214E78] p-1.5 rounded-full"
                />
              </a>

              <a href="tel:+966545938783" className="hover:underline">
                +966545938783
              </a>
            </div>
          </section>
        </div>

        {/* (5) Footer */}
        <footer className="bg-[#214E78] w-full text-center py-1 flex items-center justify-center h-full mt-[0.7rem]">
          <p className="text-[#A4D3DD] font-bold text-xs sm:text-xs">
            {t("footer")}
          </p>
        </footer>
      </div>
    </>
  );
}
