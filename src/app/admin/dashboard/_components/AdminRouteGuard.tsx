"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminEmail = localStorage.getItem("adminEmail");

      // ❌ If not admin, redirect to Arabic home
      if (!adminEmail) {
        router.replace("/ar/home");
      }
    }
  }, [router]);

  return <>{children}</>;
}
