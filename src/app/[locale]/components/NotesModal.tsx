"use client";
import { ReactNode } from "react";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function NotesModal({ isOpen, onClose, children }: ModalProps) {
  const locale = useLocale(); // Get the current locale from next-intl
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#A4D3DD] rounded-xl shadow-lg w-[40%] max-w-md max-h-[60vh] p-6 flex flex-col justify-between items-center"
      >
        {/* make children container scrollable */}
        <div className="flex-1 overflow-y-auto py-6 text-[1.1rem] text-center">
          {children}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-auto bg-[#214E78] text-white py-0.5 px-3 text-sm rounded-md self-start absolute bottom-3 left-5 cursor-pointer"
        >
          {locale == "ar" ? "حسنا" : "Ok"}
        </button>
      </div>
    </div>
  );
}
