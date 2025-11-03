"use client";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { X } from "lucide-react";
import Image from "next/image";
import { NotesModal } from "./NotesModal";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

type ElementType = {
  id: number;
  type: string;
  text_ar: string;
  text_en: string;
  created_at: string;
};

export default function SignInButton() {
  const t = useTranslations("sign_in");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [note, setNote] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState<string>("");
  const [notes, setNotes] = useState<{
    beforeAccept: string;
    firstEntry: string;
  }>({
    beforeAccept: "",
    firstEntry: "",
  });

  function handleClose() {
    setOpen(false);
    setNote("");
    setFormOtp("");
    setMessage("");
    setEmail("");
    setNotesOpen(false);
  }

  async function getNotes() {
    try {
      const response = await fetch("/api/get-additional-page-texts");
      const data = await response.json();

      if (!data.success) return false;
      const before_accept = data.data.find(
        (el: ElementType) => el.type == "before_accept"
      );
      const first_entry = data.data.find(
        (el: ElementType) => el.type == "first_entry"
      );

      setNotes({
        beforeAccept:
          locale == "ar" ? before_accept?.text_ar : before_accept?.text_en,
        firstEntry:
          locale == "ar" ? first_entry?.text_ar : first_entry?.text_en,
      });
    } catch (error) {
      return false;
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setMessage(
        `${
          locale == "ar"
            ? "حقل البريد الالكتروني مطلوب برجاء ادخاله."
            : "Email Is Required"
        }`
      );
      return;
    }

    if (otp !== formOtp) {
      setMessage(
        `${
          locale == "ar"
            ? "كود التحقق خطأ , برجاء ادخاله مره اخري بشكل صحيح."
            : "OTP is incorrect"
        }`
      );
      return;
    }

    try {
      const res = await fetch("/api/check-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const dataAdmin = await res.json();
      if (dataAdmin.isAdmin) {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminEmail", email);
        }
        router.push(`/admin/dashboard/free-trials`);
        return;
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 404) {
        setOpen(false);
        setNote(notes.firstEntry);
        setNotesOpen(true);
      } else if (response.ok && data.message?.includes("pending")) {
        setOpen(false);
        setNote(notes.beforeAccept);
        setNotesOpen(true);
      } else if (response.ok && data.message?.includes("Login successful")) {
        setOpen(false);

        if (typeof window !== "undefined") {
          localStorage.setItem("email", email);
        }

        const queryParams = new URLSearchParams({
          email: email,
          name: data.user.name,
          phone: data.user.phone,
        }).toString();

        router.push(`/ar/personal-profile?${queryParams}`);
      } else {
        setMessage(data.error || data.message || "حدث خطأ ما");
      }
    } catch (err) {
      setMessage("حدث خطأ في الاتصال بالخادم");
    }
  }

  async function handelVerfication(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setMessage(
        `${
          locale == "ar"
            ? "حقل البريد الالكتروني مطلوب برجاء ادخاله."
            : "Email Is Required"
        }`
      );
      return;
    }

    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("تم ارسال كود التحقق الي البريد الالكتروني.");
        setOtp(data.code);
      } else {
        setMessage("خطأ في ارسال كود التحقق برجاء المحاولة مره اخري.");
      }
    } catch (err) {
      setMessage("حدث خطأ في الاتصال بالخادم");
    }
  }

  useEffect(() => {
    getNotes();
  }, []);

  return (
    <>
      {/* ✅ Modified click handler */}
      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            const userEmail = localStorage.getItem("email");
            if (userEmail) {
              router.push("/ar/personal-profile");
            } else {
              setOpen(true);
            }
          } else {
            setOpen(true);
          }
        }}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Image
          src="/Images/login.png"
          alt="logo"
          width="30"
          height="30"
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9"
        />
      </button>

      <NotesModal isOpen={notesOpen} onClose={handleClose}>
        <p>{note}</p>
      </NotesModal>

      <Modal isOpen={open} onClose={handleClose}>
        <button
          onClick={handleClose}
          className={`absolute top-3 ${
            locale == "ar" ? "left-3" : "right-3"
          }  text-[#214E78] font-bold hover:text-gray-700`}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer" />
        </button>

        <h2
          className={`text-sm sm:text-lg font-semibold mb-4 text-[#214E78] ${
            locale == "ar" ? "text-right" : "text-left"
          }`}
        >
          {t("title")}
        </h2>

        <form className="text-[#214E78] font-bold flex flex-col justify-between items-center h-fit gap-5 sm:gap-6 md:gap-7 text-center w-full px-4">
          <label className="text-sm sm:text-base md:text-md">
            {t("email")}
          </label>
          <input
            name="email"
            type="email"
            placeholder={t("email_place")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            value={email}
            className="w-[90%] sm:w-[80%] md:w-[80%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
          />

          <label className="text-sm sm:text-base md:text-md">
            {t("verify_code")}
          </label>
          <div className="relative w-full flex justify-center">
            <input
              type="text"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormOtp(e.target.value)
              }
              value={formOtp}
              placeholder={t("code_place")}
              className="w-[90%] sm:w-[80%] md:w-[80%] rounded-md px-3 py-2 focus:outline-none placeholder:text-[#a4d3dd9d] placeholder:text-xs sm:placeholder:text-sm bg-[#214E78] text-center text-white text-sm sm:text-base font-medium"
            />
            <button
              type="button"
              className="absolute left-[7%] sm:left-[10%] md:left-[12%] top-[0.4rem] md:top-1 text-[#214E78] text-xs bg-[#A4D3DD] py-1 px-2 sm:py-2 sm:px-3 rounded-lg cursor-pointer"
              onClick={handelVerfication}
            >
              {t("verify")}
            </button>
          </div>

          {message && (
            <p className="text-xs p-0 m-0 text-[#214E78]">{message}</p>
          )}

          <div
            className={`overflow-visible ${
              locale == "ar" ? "mr-auto" : "ml-auto"
            } mt-[30px]`}
          >
            <button
              type="button"
              className={`sticky bottom-6 ${
                locale == "ar" ? "left-6" : "right-6"
              } bg-[#214E78] text-white py-2 px-6 text-sm rounded-md cursor-pointer`}
              onClick={handleLogin}
            >
              {t("login")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
