"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "next-intl"; // Importing useLocale from next-intl

export default function ContactUsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeNav, setActiveNav] = useState<string>("contact-us");
  const t = useTranslations("contact-us");
  const locale = useLocale(); // Get the current locale

  // Dynamically generate the base path based on the current locale
  const basePath = `/${locale}/contact-us`;

  return (
    <div className="min-h-screen bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat pt-[60px] flex flex-col items-center mt-[100px]">
      {/* Title */}
      <h1 className="text-[#214E78] font-bold text-lg sm:text-xl md:text-2xl text-center mb-4">
        {t("title")}
      </h1>

      {/* Main Card */}
      <div className="bg-[#214E78] w-[90%] sm:w-[80%] md:w-[65%] lg:w-[55%] flex flex-col rounded-2xl px-3 py-5 md:px-7 md:py-9 shadow-lg mb-8">
        {/* Navigation Tabs */}
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-8 text-white font-extrabold text-sm sm:text-base">
          <li>
            <Link
              href={`${basePath}`}
              className={`transition-all duration-300 ${
                activeNav === "contact-us"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("contact-us")}
            >
              {t("contact")}
            </Link>
          </li>
          <li>
            <Link
              href={`${basePath}/social-media-accounts`}
              className={`transition-all duration-300 ${
                activeNav === "social-media-accounts"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("social-media-accounts")}
            >
              {t("social")}
            </Link>
          </li>
        </ul>

        {/* Content Box */}
        <section className="bg-[#A4D3DD] text-center font-semibold text-[#214E78] mt-6 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center min-h-[300px]">
          {children}
        </section>
      </div>
    </div>
  );
}
