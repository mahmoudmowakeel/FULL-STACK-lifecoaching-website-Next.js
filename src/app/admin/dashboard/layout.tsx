"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderBar from "./_components/HeaderBar";
import NavBar from "./_components/NavBar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const adminEmail = localStorage.getItem("adminEmail");

    if (adminEmail) {
      // ✅ Admin found → allow access
      setIsAllowed(true);
    } else {
      // ❌ No admin → redirect to home
      router.replace("/ar/home");
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-[#214E78] font-bold text-lg">
       ...
      </div>
    );
  }

  if (!isAllowed) return null;

  return (
    <div
      dir="rtl"
      className="h-screen flex flex-col overflow-hidden bg-[url('/images/bg.jpg')] bg-cover"
    >
      <main className="flex flex-1">
        {/* Sidebar */}
        <NavBar />

        {/* Main content area */}
        <div className="flex-1 bg-gray-50 bg-[url('/Images/bg.jpg')] bg-cover">
          <HeaderBar />
          <div className="my-4 h-[85vh] overflow-y-auto px-4">{children}</div>
        </div>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
