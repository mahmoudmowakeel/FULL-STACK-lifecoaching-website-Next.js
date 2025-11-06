"use client";

import { useRouter } from "next/navigation";

export default function HeaderBar() {
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminEmail"); // 🧹 remove admin session
    }
    router.push("/ar/home"); // 🔁 redirect to home
  }

  return (
    <header className="h-16 bg-transparent text-white flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-[#214E78]">
        لوحة التحكم / Dashboard
      </h1>

      <div className="text-center font-bold text-[#214E78]">
        <button
          onClick={handleLogout}
          className="cursor-pointer hover:text-white transition"
        >
          خروج <br /> logout
        </button>
      </div>
    </header>
  );
}
