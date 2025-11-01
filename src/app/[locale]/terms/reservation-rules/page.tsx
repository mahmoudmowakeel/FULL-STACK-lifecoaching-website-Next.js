"use client";
import { useTranslations } from "next-intl";

export default function ReservationRulesPage() {
  const t = useTranslations("rules");

  return (
    <div className="w-full h-[70%] bg-[#214E78] rounded-2xl flex items-center justify-center text-xs md:text-sm">
      +
      <div className="my-auto w-fit">
        <ul className="list-disc list-inside marker:text-2xl text-xs marker:text-white h-full  px-8 py-5 text-white font-bold flex flex-col gap-3">
          <li>
           {t('rule1')}
          </li>
          <li>
            {t('rule2')}
          </li>
          <li>
           {t('rule3')}
          </li>
          <li>
            {t('rule4')}
          </li>
          <li>
           {t('rule5')}
          </li>
          <li>
           {t('rule6')}
          </li>
        </ul>
      </div>
    </div>
  );
}
