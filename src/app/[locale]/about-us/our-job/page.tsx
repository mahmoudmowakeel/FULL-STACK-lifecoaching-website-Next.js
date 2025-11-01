'use client';
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook


export default function OurMessagePage() {
  const t = useTranslations("about-us");
  const locale = useLocale();

  return (
    <div className="text-center w-full ">
      <p className={`leading-10 px-5 ${locale == "ar" ? 'text-xs md:text-lg': "text-[10px] md:text-sm"}`}>{t("what-we-doText")}</p>
    </div>
  );
}
