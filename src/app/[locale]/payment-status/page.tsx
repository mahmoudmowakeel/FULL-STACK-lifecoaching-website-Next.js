"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentStatusPage() {
  const params = useSearchParams();
  const status = params.get("status");

  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      {status === "success" ? (
        <div className="text-green-600 text-2xl font-semibold">
          ✅ Payment Successful! Your reservation is confirmed.
        </div>
      ) : (
        <div className="text-red-600 text-2xl font-semibold">
          ❌ Payment Failed. Please try again.
        </div>
      )}
    </div>
  );
}
