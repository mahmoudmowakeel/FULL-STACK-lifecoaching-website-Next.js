"use client";
import { use, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import DateTimePicker from "./DateTimePicker";
import { FreeTrialFormData } from "@/lib/types/freeTrials";
import { NotesModal } from "./NotesModal";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function FreeTrialButton({ text }: { text: string }) {
  const t = useTranslations("homePage");
  const freeTrialT = useTranslations("free_trials"); // Translations for free_trials
  const locale = useLocale(); // Get the current locale from next-intl

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FreeTrialFormData>({
    name: "", // Always required field
    phone: "", // Optional, can be an empty string or null
    email: "", // Optional, can be an empty string or null
    date_time: null, // Optional, will use the current timestamp if not provided
    status: "pending", // Optional, default will be 'pending' in the DB
  });
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<{
    after_free: string;
  }>({
    after_free: "",
  });
  const [pMessage, setPmessage] = useState<{
    complete_freeTrial: string;
  }>({
    complete_freeTrial: "",
  });

  async function getNotes() {
    try {
      const response = await fetch("/api/get-additional-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const afterFree = data.data.find(
        (el: ElementType) => el.type == "after_freetrial"
      );

      setNotes({
        after_free: locale == "ar" ? afterFree?.text_ar : afterFree?.text_en,
      });

      return;
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }
  async function getPmessages() {
    try {
      const response = await fetch("/api/get-final-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const afterFree = data.data.find(
        (el: ElementType) => el.type == "free_trial"
      );

      setPmessage({
        complete_freeTrial:
          locale == "ar" ? afterFree?.text_ar : afterFree?.text_en,
      });

      return;
    } catch (error) {
      console.error("Error checking hiring status:", error);
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let formattedDate = formData.date_time;
      if (formattedDate) {
        const date = new Date(formattedDate);
        formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }

      const formDataWithDate = {
        ...formData,
        date_time: formattedDate,
      };
      const response = await fetch("/api/create_free_trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataWithDate),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Booking is successful
        setMessage("جاري تاكيد الحجز...");
        console.log("timeeeeeeeeeeee" + formData.date_time);
        const startTime = new Date(formData.date_time!);

        const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

        // Create Google Meet
        const meetingResponse = await fetch("/api/create-meeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime,
            endTime,
            summary: "Life Coach Meeting",
            description: `Life coaching session for ${formData.email}`,
          }),
        });

        const meetingData = await meetingResponse.json();

        if (!meetingResponse.ok || !meetingData.success) {
          console.error("⚠️ Meeting creation failed:", meetingData.error);
          throw new Error("فشل في إنشاء اجتماع Google Meet.");
        }

        console.log("✅ Meeting created:", meetingData);

        // Send email with meeting details
        const emailResponse = await fetch("/api/send_meeting_freeTrial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: formData.name || "العميل",
            customerEmail: formData.email,
            meetingDetails: {
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              summary: "تجربة مجانيه",
              meetLink: meetingData.hangoutLink,
              eventLink: meetingData.eventLink,
            },
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok || !emailResult.success) {
          console.error("⚠️ Email send failed:", emailResult.error);
          throw new Error(
            "تم الحجز ولكن حدث خطأ أثناء إرسال البريد الإلكتروني."
          );
        }

        // **Update the calendar slot to "booked" after successful booking**
        const selectedDateISO = selectedDate
          ? new Date(
              selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0]
          : "";

        const readySlot = [
          {
            date: selectedDateISO,
            time_slot: selectedTime,
            status: "booked",
          },
        ];
        const updateSlotResponse = await fetch(
          "/api/update_freeTrial_calendar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slots: readySlot,
            }),
          }
        );

        const updateSlotData = await updateSlotResponse.json();
        if (!updateSlotResponse.ok || !updateSlotData.success) {
          console.error("⚠️ Calendar update failed:", updateSlotData.error);
          throw new Error("فشل في تحديث التقويم.");
        }

        setOpen(false);
        const date = new Date(new Date(formData.date_time as string));
        const formatted = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
        setNote(
          pMessage.complete_freeTrial
            .replace(`(اسم العميل)`, formData.name.split("@")[0])
            .replace("تاريخ و يوم", formatted!)
            .replace("ووقت", "")
        );
        setNotesOpen(true);
      } else if (
        response.status === 409 ||
        data.message === "Email already registered"
      ) {
        // ⚠️ Email already exists
        setOpen(false);
        setNote(notes.after_free);
        setNotesOpen(true);
      } else {
        // ❌ Other server or validation error
        console.error("❌ Error:", data.error || data.message);
        alert("Something went wrong. Please try again later.");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handelVerfication(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(freeTrialT("otp_sent"));
      setOtp(data.code);
    } else {
      setMessage("خطأ في ارسال كود التحقق برجاء المحاولة مره اخري.");
    }
  }

  function handelNext(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email || !formData.phone || !formData.name) {
      setMessage(freeTrialT("required"));
      return;
    }
    if (otp != formOtp) {
      setMessage(freeTrialT("otp_wrong"));
      return;
    }
    setMessage("");
    setStep(2);
  }
  function handelPrev(e: React.FormEvent) {
    e.preventDefault();
    setStep(1);
  }

  function handleClose() {
    setNotesOpen(false);
    setOpen(false);
    setStep(1);
    setFormOtp("");
    setMessage("");
    setFormData({
      name: "",
      phone: "",
      email: "",
      date_time: null,
      status: "pending",
    });
  }

  useEffect(() => {
    getNotes();
    getPmessages();
  }, []);

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
    { name: "Canada", code: "+1", flag: "🇨🇦" },
  ];

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full w-full sm:w-auto"
      >
        <section className="w-full max-w-sm mx-auto h-full text-sm sm:text-[12px] bg-[url('/Images/bg.jpg')] bg-cover bg-center rounded-2xl cursor-pointer ">
          <div className="bg-[#214e78b2] hover:bg-[#ffffff7e] hover:font-extrabold hover:text-[#214e78b2] transition duration-300 h-full w-full rounded-2xl text-white flex flex-col justify-center items-center gap-3 p-1 sm:px-1">
            <div className=" md:p-1 flex flex-col gap-4 sm:gap-6 w-full">
              <h1 className="text-[12px] sm:text-[14px] font-bold text-center">
                {t("freeTrail")}
              </h1>
              <p
                className={`w-full max-w-xs mx-auto leading-6 sm:leading-7 font-semibold text-center ${
                  locale == "ar"
                    ? "text-[10px] sm:text-[12px]"
                    : "text-[10px] sm:text-[10px]"
                } `}
              >
                {text}
              </p>
            </div>
          </div>
        </section>
      </button>

      <NotesModal isOpen={notesOpen} onClose={handleClose}>
        <p>{note}</p>
      </NotesModal>

      <Modal isOpen={open} onClose={handleClose}>
        <button
          onClick={handleClose}
          className={`absolute top-3 ${
            locale == "ar" ? " left-3" : " right-3"
          } text-[#214E78] font-bold hover:text-gray-700 z-10`}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer" />
        </button>

        <h2
          className={`text-sm sm:text-lg font-semibold mb-4 sm:mb-6 text-[#214E78] ${
            locale == "ar" ? "text-right" : "text-left"
          }`}
        >
          {freeTrialT("title")}
        </h2>

        {step === 1 && (
          <form className="text-[#214E78] font-bold flex flex-col mt-8 sm:mt-12 justify-between items-center h-fit gap-4 sm:gap-7 text-center w-full ">
            <div className="w-full max-w-xs sm:max-w-none sm:w-[85%] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
              <label
                className={`w-full sm:w-auto text-right mb-1 sm:mb-0 text-xs sm:text-sm`}
              >
                {freeTrialT("name")}
              </label>
              <input
                name="name"
                type="text"
                placeholder={freeTrialT("name_place")}
                value={formData.name}
                onChange={handleChange}
                className="w-full sm:w-[70%] rounded-md px-3 py-2 sm:py-3 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-sm text-lg bg-[#214E78] text-center text-white font-medium"
              />
            </div>

            <div className="w-full max-w-xs sm:max-w-none sm:w-[85%] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
              <label className="w-full sm:w-auto text-right mb-1 sm:mb-0 text-xs sm:text-sm">
                {freeTrialT("phone")}
              </label>
              {/* ✅ Phone with country code dropdown */}
              <div className="w-full sm:w-[70%] flex items-center gap-2 relative">


                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder={freeTrialT("phone_place")}
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: `${selectedCountry.code}${e.target.value.replace(
                        selectedCountry.code,
                        ""
                      )}`,
                    })
                  }
                  className="w-[60%] sm:w-[70%] bg-[#214E78] text-white rounded-md px-3 py-2 sm:py-3 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-sm text-sm text-center font-medium"
                />
                                <div className="relative w-[40%] sm:w-[30%]">
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
                    <div className="absolute z-50 bg-white text-[#214E78] rounded-md shadow-lg mt-1 w-48 max-h-60 overflow-y-auto">
                      <input
                        type="text"
                        placeholder={freeTrialT("search_country")}
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

            <div className="w-full max-w-xs sm:max-w-none sm:w-[85%] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
              <label className="w-full sm:w-auto text-right mb-1 sm:mb-0 text-xs sm:text-sm">
                {freeTrialT("email")}
              </label>
              <input
                name="email"
                type="email"
                placeholder={freeTrialT("email_place")}
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full sm:w-[70%] rounded-md px-3 py-2 sm:py-3 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-sm text-sm bg-[#214E78] text-center text-white font-medium"
              />
            </div>

            <div className="w-full max-w-xs sm:max-w-none sm:w-[85%] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center relative">
              <label className="w-full sm:w-auto text-right mb-1 sm:mb-0 text-xs sm:text-sm">
                {freeTrialT("verify_code")}
              </label>
              <div className="w-full sm:w-[70%] relative">
                <input
                  name="otp"
                  type="text"
                  placeholder={freeTrialT("verify_code_place")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormOtp(e.target.value)
                  }
                  value={formOtp}
                  className="w-full rounded-md px-3 py-2 sm:py-3 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-sm text-sm bg-[#214E78] text-center text-white font-medium  mx-auto"
                />
                <button
                  type="submit"
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 text-[#214E78] text-xs bg-[#A4D3DD] py-1 px-2 sm:py-2 sm:px-3 rounded-lg cursor-pointer"
                  onClick={handelVerfication}
                >
                  {freeTrialT("verify")}
                </button>
              </div>
            </div>
            {message ? (
              <p className="text-xs p-0 m-0 text-[#214E78]">{message}</p>
            ) : (
              ""
            )}
            <div
              className={`overflow-visible ${
                locale == "ar" ? "mr-auto" : "ml-auto"
              }  mt-[30px]`}
            >
              <button
                type="submit"
                className={`sticky bottom-6 ${
                  locale == "ar" ? " left-6" : "right-6"
                } bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer`}
                onClick={handelNext}
              >
                {freeTrialT("next")}
              </button>
            </div>
          </form>
        )}

        {step == 2 && (
          <>
            <DateTimePicker<FreeTrialFormData>
              formData={formData}
              setFormData={setFormData}
              type="free_trial"
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
            />
            <div
              dir="ltr"
              className="overflow-visible mr-auto mt-20 md:mt-[30px] flex flex-col sm:flex-row gap-1 justify-between items-center w-full max-w-xl sticky bottom-6 left-6"
            >
              <button
                type="submit"
                className="bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer w-[80%] max-w-xs sm:w-auto order-2 sm:order-1"
                onClick={handleSubmit}
              >
                {freeTrialT("submit")}
              </button>
              <button
                type="button"
                className="bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer w-[80%] max-w-xs sm:w-auto order-1 sm:order-2 mb-3 sm:mb-0"
                onClick={handelPrev}
              >
                {freeTrialT("prev")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
