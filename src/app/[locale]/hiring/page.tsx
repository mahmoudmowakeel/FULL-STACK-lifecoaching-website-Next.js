"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { NotesModal } from "../components/NotesModal";

const countries = [
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Jordan", code: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "+961", flag: "🇱🇧" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Morocco", code: "+212", flag: "🇲🇦" },
  { name: "Tunisia", code: "+216", flag: "🇹🇳" },
  { name: "Algeria", code: "+213", flag: "🇩🇿" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "Canada", code: "+1", flag: "🇨🇦" }
];

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
    message: ""
  });

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pMessage, setPmessage] = useState<{ apply: string }>({ apply: "" });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/add-hiring-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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
              type: "apply"
            })
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

  useEffect(() => {
    getPmessages();
  }, []);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <NotesModal isOpen={showModal} onClose={() => setShowModal(false)}>
        <p>{message}</p>
      </NotesModal>

      <div className="w-full min-h-[100vh] mt-7 bg-[url('/Images/bg.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-4">
        <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[60%]">
          <h1 className="text-[#214E78] font-bold text-lg sm:text-xl text-center mb-3">
            {t("title")}
          </h1>

          <div className="bg-[#A4D3DD] rounded-2xl">
            <form
              onSubmit={handleSubmit}
              className="backdrop-blur-sm p-5 sm:p-8 rounded-xl mx-auto text-[#214E78] font-semibold space-y-5"
            >
              {/* name */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full sm:w-[80%] mx-auto gap-2">
                <label htmlFor="name" className="sm:w-1/3 text-right w-full">
                  {t("name")}
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  className="sm:w-2/3 w-full bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A4D3DD]"
                  required
                />
              </div>

              {/* phone */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full sm:w-[80%] mx-auto gap-2 relative">
                <label htmlFor="phone" className="sm:w-1/3 text-right w-full">
                  {t("phone")}
                </label>
                <div className="flex w-full sm:w-2/3 gap-2 relative">
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="text"
                    className="w-3/4 bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A4D3DD]"
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
                            }}
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
              </div>

              {/* email */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full sm:w-[80%] mx-auto gap-2">
                <label htmlFor="email" className="sm:w-1/3 text-right w-full">
                  {t("email")}
                </label>
                <input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  required
                  className="sm:w-2/3 w-full bg-[#214E78] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A4D3DD]"
                />
              </div>

              {/* message */}
              <div className="w-full sm:w-[80%] mx-auto">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("placeholder_message")}
                  className="w-full bg-[#214E78] text-white rounded-md p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#A4D3DD]"
                />
              </div>

              {/* submit */}
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
