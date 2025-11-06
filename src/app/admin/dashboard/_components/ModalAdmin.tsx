"use client";
import { ReactNode } from "react";
import { useLocale } from "next-intl"; // Use next-intl's useLocale hook

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AdminModal({ isOpen, onClose, children }: ModalProps) {

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80  flex items-center justify-center z-50"
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
