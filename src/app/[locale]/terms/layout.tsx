"use client";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "next-intl"; // Importing useLocale from next-intl

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeNav, setActiveNav] = useState<string>("terms");
  const locale = useLocale(); // Get the current locale

  // Dynamically generate the base path based on the current locale
  const basePath = `/${locale}/terms`;

  return (
    <div className="w-full min-h-screen bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-center pt-[50px] px-2 sm:px-0 mt-[100px]">
      {/* Navigation */}
      <div className="w-full flex justify-center">
        <ul className={`flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-16 ${locale == "ar" ? 'text-[0.9rem] sm:text-[1rem] md:text-[1.1rem]' : 'text-[0.7rem] sm:text-[0.6rem] md:text-[0.8rem]'}  text-[#214E78] font-extrabold text-center`}>
          <li>
            <Link
              href={`${basePath}`} // Dynamic path for "Terms"
              className={activeNav === "terms" ? "active-about-us" : ""}
              onClick={() => setActiveNav("terms")}
            >
              {locale === "ar" ? "المبادئ والقيم" : "Principles & Values"}
            </Link>
          </li>
          <li>
            <Link
              href={`${basePath}/reservation-rules`} // Dynamic path for "Reservation Rules"
              className={activeNav === "reservation-rules" ? "active-about-us" : ""}
              onClick={() => setActiveNav("reservation-rules")}
            >
              {locale === "ar" ? "شروط الحجز" : "Reservation Rules"}
            </Link>
          </li>
        </ul>
      </div>

      {/* Content */}
      <div className="w-full sm:w-[80%] md:w-[65%] h-full mt-5 px-2 sm:px-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
