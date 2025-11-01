"use client";
import { ReactNode } from "react";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const locale = useLocale(); // Get the current locale from next-intl

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80  flex items-center justify-center z-50"
      dir={`${locale == "ar" ? "rtl" : "ltr"}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#A4D3DD] rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] p-6 relative overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}
