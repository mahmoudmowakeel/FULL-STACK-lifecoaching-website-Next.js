"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminEmail = localStorage.getItem("adminEmail");

      if (adminEmail) {
        // ✅ If logged in as admin → redirect to free-trials dashboard
        router.replace("/admin/dashboard/free-trials");
      } else {
        // ❌ If not admin → send back to home
        router.replace("/ar/home");
      }
    }
  }, [router]);

  return null; // nothing rendered, it just redirects
}
