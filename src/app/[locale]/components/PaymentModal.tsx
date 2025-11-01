"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { useTranslations } from "next-intl"; // 👈 import your translation hook
import { ReservationFormData } from "@/lib/types/freeTrials";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ReservationFormData;
  amount: number | undefined | string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function PaymentModal({
  isOpen,
  onClose,
  formData,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const t = useTranslations("PaymentModal"); // 👈 translation namespace

  useEffect(() => {
    if (!isOpen) return;
    const createPaymentIntent = async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amount) }),
        });
        const data = await res.json();
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onPaymentError(t("error_creating"));
        }
      } catch (err) {
        console.error(err);
        onPaymentError(t("error_server"));
      }
    };
    createPaymentIntent();
  }, [isOpen, amount, onPaymentError, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[95%] max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          {t("close")}
        </button>

        <h2 className="text-lg font-semibold text-[#214E78] mb-4 text-center">
          {t("title")}
        </h2>

        {!clientSecret ? (
          <p className="text-center text-gray-500">{t("loading")}</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              onClose={onClose}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
              amount={amount}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

function CheckoutForm({
  onClose,
  onPaymentSuccess,
  onPaymentError,
  amount,
}: {
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  amount: undefined | number | string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("PaymentModal"); // 👈 use translations here too

  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "confirming" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus("processing");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Payment error:", error.message);
      setStatus("error");
      setMessage(t("payment_error"));
      onPaymentError(error.message || t("payment_failed"));
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setStatus("success");
      setMessage(t("payment_success"));
      setTimeout(() => {
        setStatus("confirming");
        setMessage(t("confirming"));
        setTimeout(() => {
          onPaymentSuccess(paymentIntent.id);
        }, 1200);
      }, 1500);
    } else {
      setStatus("error");
      setMessage(t("payment_failed"));
      onPaymentError(t("payment_failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-center">
      {status === "idle" || status === "processing" ? (
        <>
          <PaymentElement />
          <button
            type="submit"
            disabled={!stripe || status === "processing"}
            className="w-full bg-[#214E78] text-white py-2 rounded-md hover:bg-[#1a3e63] transition duration-200"
          >
            {status === "processing" ? t("processing") : t("pay_now")} {amount}{" "}
            {t("currency")}
          </button>
        </>
      ) : (
        <div className="py-6">
          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <p className="text-green-600 font-semibold">{message}</p>
            </div>
          )}

          {status === "confirming" && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-[#214E78] font-semibold">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold text-lg">×</span>
              </div>
              <p className="text-red-600 font-semibold">{message}</p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
