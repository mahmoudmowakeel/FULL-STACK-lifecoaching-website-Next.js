"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

export default function AboutUsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeNav, setActiveNav] = useState<string>("about-us");
  const t = useTranslations("about-us");
  const locale = useLocale(); // Get current locale

  // Dynamically generate the base path based on the current locale
  const basePath = `/${locale}/about-us`;

  return (
    <div className="min-h-screen bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat pt-[60px] flex flex-col items-center mt-[100px]">
      {/* Page Header */}
      <h1 className="text-[#214E78] font-bold text-lg sm:text-xl md:text-2xl text-center mb-4">
        {t("title")}
      </h1>

      {/* Content Card */}
      <div className="bg-[#214E78] w-[90%] sm:w-[80%] md:w-[65%] lg:w-[55%] flex flex-col rounded-2xl px-3 md:px-6 py-6 md:py-8 shadow-lg mb-8">
        {/* Navigation Tabs */}
        <ul className={`flex flex-wrap justify-center gap-3 sm:gap-6 text-white font-extrabold ${locale == "ar" ? 'text-[12px] sm:text-base' : ' text-[9px] sm:text-xs'}`}>
          <li>
            <Link
              href={`${basePath}`}
              className={`transition-all duration-300 ${
                activeNav === "about-us"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("about-us")}
            >
              {t("who-are-us")}
            </Link>
          </li>
          <li>
            <Link
              href={`${basePath}/our-message`}
              className={`transition-all duration-300 ${
                activeNav === "our-message"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("our-message")}
            >
              {t("our-message")}
            </Link>
          </li>
          <li>
            <Link
              href={`${basePath}/why-us`}
              className={`transition-all duration-300 ${
                activeNav === "why-us"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("why-us")}
            >
              {t("why-us")}
            </Link>
          </li>
          <li>
            <Link
              href={`${basePath}/our-job`}
              className={`transition-all duration-300 ${
                activeNav === "our-job"
                  ? "active-about-us text-[#A4D3DD]"
                  : "hover:text-[#A4D3DD]"
              }`}
              onClick={() => setActiveNav("our-job")}
            >
              {t("what-we-do")}
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
