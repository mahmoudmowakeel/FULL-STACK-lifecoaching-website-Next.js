"use client";
import { useLocale, useTranslations } from "next-intl";

export default function TermsPage() {
  const locale = useLocale(); // Get the current locale from next-intl

  const t = useTranslations("terms_conditions");

  return (
    <div className={`w-full h-[70%] bg-[#a4d3ddb3] rounded-2xl flex items-center justify-center ${locale == "ar" ? 'text-xs md:text-md' : "text-xs md:text-sm"}`}>
      <div className="my-auto w-fit">
        <ul className=" list-disc list-inside marker:text-2xl px-8 py-5 text-[#214E78] font-bold flex flex-col gap-10">
          <li className="leading-8">{t("term1")}</li>
          <li className="leading-8">{t("term2")}</li>
        </ul>
      </div>
    </div>
  );
}
