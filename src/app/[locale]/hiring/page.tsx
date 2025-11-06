"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { NotesModal } from "../components/NotesModal";
import { useLocale } from "next-intl";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import countriesData from "country-telephone-data";

const countries = countriesData.allCountries.map((c) => ({
  name: c.name,
  code: `+${c.dialCode}`,
  flag: getFlagEmoji(c.iso2),
}));
function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function HiringPage() {
  const t = useTranslations("hiring");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const locale = useLocale();

  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [showModal, setShowModal] = useState(false);
  const [pMessage, setPmessage] = useState<{ apply: string }>({ apply: "" });
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  async function getPmessages() {
    try {
      const response = await fetch("/api/get-final-page-texts");
      const data = await response.json();
      if (!data.success) return;
      const afterReserve = data.data.find(
        (el: ElementType) => el.type == "apply"
      );
      setPmessage({ apply: afterReserve?.text_ar || "" });
    } catch (error) {
      console.error("Error fetching text:", error);
    }
  }

  useEffect(() => {
    getPmessages();
  }, []);

  // ✅ Handle Input Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone") {
      try {
        const parsed = parsePhoneNumberFromString(
          selectedCountry.code + value.replace(/\D/g, "")
        );
        if (parsed && parsed.isValid()) {
          setPhoneError("");
        } else {
          setPhoneError("❌ رقم غير صالح لهذا البلد");
        }
      } catch {
        setPhoneError("❌ رقم غير صالح");
      }
    }
  };

  // ✅ Handle Email Verification
  async function handleVerification(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.email) {
      setMessage("يرجى إدخال البريد الإلكتروني أولاً");
      return;
    }

    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ تم إرسال كود التحقق إلى البريد الإلكتروني.");
        setOtp(data.code);
      } else {
        setMessage("❌ خطأ في إرسال كود التحقق، حاول مرة أخرى.");
      }
    } catch (err) {
      setMessage("حدث خطأ في الاتصال بالخادم.");
    }
  }

  // ✅ Handle Submit (includes OTP check)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check OTP before submit
    if (!formData.email) {
      setMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    if (otp !== formOtp) {
      setMessage("❌ كود التحقق غير صحيح.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/add-hiring-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        try {
          await fetch("/api/send-general-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: formData.name,
              customerEmail: formData.email,
              type: "apply",
            }),
          });
        } catch (emailErr) {
          console.error("❌ Failed to send email:", emailErr);
        }

        setStatus("success");
        setMessage(
          pMessage.apply
            .replace(`(اسم العميل)`, formData.name)
            .replace("تاريخ و يوم", "")
            .replace("ووقت", "")
        );
        setShowModal(true);
        setFormData({ name: "", phone: "", email: "", message: "" });
        setOtp("");
        setMessage("");
        setFormOtp("");
      } else {
        setStatus("error");
        setMessage(t("apply_error"));
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(t("apply_warning"));
      setShowModal(true);
    }
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <NotesModal isOpen={showModal} onClose={() => setShowModal(false)}>
        <p>{message}</p>
      </NotesModal>

      <div className="w-full min-h-[100vh] mt-10 bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-4">
        <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[60%]">
          <h1 className="text-[#214E78] font-bold text-lg sm:text-xl text-center mb-3">
            {t("title")}
          </h1>

          <div className="bg-[#A4D3DD] h-[50%] rounded-2xl">
            <form
              onSubmit={handleSubmit}
              className="backdrop-blur-sm p-5 sm:p-8 rounded-xl mx-auto text-[#214E78] font-semibold space-y-2"
            >
              {/* Name */}
              <div className="flex flex-col sm:flex-row justify-between items-center w-full sm:w-[80%] mx-auto gap-2">
                <label htmlFor="name" className="sm:w-1/3 text-right w-full">
                  {t("name")}
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  className="sm:w-2/3 w-full bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none text-center"
                  required
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col sm:flex-row justify-between items-start w-full sm:w-[80%] mx-auto gap-2 relative">
                <label
                  htmlFor="phone"
                  className="sm:w-1/3 text-right w-full mt-2"
                >
                  {t("phone")}
                </label>

                <div className="flex flex-col sm:w-2/3 w-full gap-2 relative">
                  <div className="flex w-full gap-2 relative">
                    <input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel"
                      placeholder={t("phone")}
                      className={`w-3/4 bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none text-center ${
                        phoneError ? "border-2 border-red-500" : ""
                      }`}
                    />

                    <div className="relative w-1/4">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="w-full bg-[#214E78] text-white rounded-md px-3 py-2 flex items-center justify-between"
                      >
                        <span>
                          {selectedCountry.flag} {selectedCountry.code}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute z-50 bg-white text-[#214E78] rounded-md shadow-lg mt-1 w-56 max-h-60 overflow-y-auto">
                          <input
                            type="text"
                            placeholder={t("search_country")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full p-2 border-b border-gray-300 focus:outline-none text-sm"
                          />
                          {filteredCountries.map((country) => (
                            <div
                              key={country.code + country.name}
                              onClick={() => {
                                setSelectedCountry(country);
                                setDropdownOpen(false);
                                setSearch("");
                                // re-validate on country change
                                const parsed = parsePhoneNumberFromString(
                                  country.code +
                                    formData.phone.replace(/\D/g, "")
                                );
                                if (parsed && parsed.isValid()) {
                                  setPhoneError("");
                                } else {
                                  setPhoneError("❌ رقم غير صالح لهذا البلد");
                                }
                              }}
                              dir="ltr"
                              className="px-3 py-2 cursor-pointer hover:bg-[#A4D3DD] text-sm flex items-center gap-2"
                            >
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                              <span className="ml-auto">{country.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              {/* Email + OTP */}
              <div className="flex flex-col sm:flex-row justify-between items-center w-full sm:w-[80%] mx-auto gap-2 relative">
                <label htmlFor="email" className="sm:w-1/3 text-right w-full">
                  {t("email")}
                </label>

                <div className="flex flex-col sm:w-2/3 w-full gap-2 relative">
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      required
                      className="w-full bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none text-center"
                    />
                    <button
                      type="button"
                      onClick={handleVerification}
                      className="absolute left-2 top-[0.35rem] bg-[#A4D3DD] text-[#214E78] text-xs py-1 px-3 rounded-md "
                    >
                      تحقق
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="ادخل كود التحقق"
                    value={formOtp}
                    onChange={(e) => setFormOtp(e.target.value)}
                    className="w-full bg-[#214E78] placeholder:text-xs text-center text-white rounded-md px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="w-full sm:w-[80%] mx-auto">
                <label htmlFor="message" className="text-sm mb-4">
                  هذه المساحه مخصصه لك .. شاركنا سيرتك الذاتيه كما تراها انت و
                  بأسلوبك الخاص
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("placeholder_message")}
                  className="w-full bg-[#214E78] text-white rounded-md p-3 min-h-[150px] focus:outline-none"
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="on"
                  lang={locale}
                  // ensure emoji support on all keyboards
                  style={{
                    fontFamily:
                      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'",
                  }}
                />
              </div>

              {message && (
                <p className="text-center text-sm text-[#214E78]">{message}</p>
              )}

              {/* Submit */}
              <div className="flex justify-end w-full sm:w-[80%] mx-auto">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-[#214E78] text-white rounded-md px-6 py-2 font-bold hover:bg-[#1b3f60] transition disabled:opacity-60 w-full sm:w-auto"
                >
                  {status === "loading" ? t("sending") : t("send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
