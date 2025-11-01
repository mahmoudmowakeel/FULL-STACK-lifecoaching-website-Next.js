"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // For the hamburger and close icons
import LanguageToggle from "./ToggleLanguage";
import SignInButton from "./SignInComponent";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

export default function NavBar() {
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale(); // Get the current locale from next-intl

  return (
    <header className="w-full shadow-sm bg-white fixed top-0 left-0 z-50">
      <div className="flex justify-between items-center px-6 py-2 md:px-12">
        {/* Logo */}
        <section className="flex items-center">
          <Image src={t("logo")} alt="logo" width="130" height="130" />
        </section>

        {/* Desktop Menu */}
        <nav className="hidden md:block">
          <ul className="flex gap-x-12 text-[#214E78] font-bold text-sm">
            <li>
              <Link href={`/${locale}/home`}>{t("home")}</Link> {/* Dynamically use locale */}
            </li>
            <li>
              <Link href={`/${locale}/about-us`}>{t("about_us")}</Link> {/* Dynamically use locale */}
            </li>
            <li>
              <Link href={`/${locale}/terms`}>{t("terms")}</Link> {/* Dynamically use locale */}
            </li>
            <li>
              <Link href={`/${locale}/contact-us`}>{t("contact_us")}</Link> {/* Dynamically use locale */}
            </li>
          </ul>
        </nav>

        {/* Right Section (Buttons + Language Toggle) */}
        <div className="hidden md:flex items-center gap-8">
          <SignInButton />
          <LanguageToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#214E78]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <ul className="flex flex-col items-center gap-4 py-4 text-[#214E78] font-semibold">
            <li>
              <Link href={`/${locale}/home`} onClick={() => setIsOpen(false)}>
                {t("home")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about-us`} onClick={() => setIsOpen(false)}>
                {t("about_us")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} onClick={() => setIsOpen(false)}>
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact-us`} onClick={() => setIsOpen(false)}>
                {t("contact_us")}
              </Link>
            </li>
            <div className="flex gap-6 pt-3">
              <SignInButton />
              <LanguageToggle />
            </div>
          </ul>
        </div>
      )}
    </header>
  );
}
