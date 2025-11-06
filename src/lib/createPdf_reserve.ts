"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import { reshape } from "arabic-persian-reshaper";
import { bidi } from "bidi-js";
import { Reservation } from "@/app/admin/dashboard/reservations/page";

// ✅ Load Arabic-supporting font (Amiri)
const AMIRI_BASE64 = fs.readFileSync(
  "public/fonts/Amiri-Regular.ttf",
  "base64"
);

/**
 * Fixes Arabic text for jsPDF (reshapes letters + sets correct RTL order)
 */
function fixArabicText(text: string): string {
  if (!text) return "";
  const reshaped = reshape(text);
  const bidiText = bidi(reshaped, { direction: "rtl" }).text;
  return bidiText;
}

/**
 * Downloads reservation table as bilingual PDF
 */
export function downloadReservationsPDF(data: Reservation[], status?: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  // ✅ Register Amiri font
  doc.addFileToVFS("Amiri-Regular.ttf", AMIRI_BASE64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");

  // ===== HEADER =====
  doc.setFontSize(20);
  doc.setTextColor(33, 78, 120); // #214E78
  doc.text(
    fixArabicText("تقرير الحجوزات"),
    doc.internal.pageSize.width - 14,
    20,
    { align: "right" }
  );
  doc.text("Reservations Report", 14, 20);

  // ===== METADATA =====
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);

  const today = new Date();
  const arabicDate = today.toLocaleDateString("ar-EG");
  const englishDate = today.toLocaleDateString("en-US");

  doc.text(
    fixArabicText(`تاريخ: ${arabicDate}`),
    doc.internal.pageSize.width - 14,
    28,
    { align: "right" }
  );
  doc.text(`Date: ${englishDate}`, 14, 28);

  let yPos = 34;

  if (status) {
    const statusMap: Record<string, string> = {
      pending: "قيد الانتظار",
      completed: "مكتمل",
      canceled: "ملغى",
    };
    const statusArabic = statusMap[status] || status;

    doc.text(
      fixArabicText(`الحالة: ${statusArabic}`),
      doc.internal.pageSize.width - 14,
      yPos,
      { align: "right" }
    );
    doc.text(`Status: ${status}`, 14, yPos);
    yPos += 6;
  }

  doc.text(
    fixArabicText(`المجموع: ${data.length}`),
    doc.internal.pageSize.width - 14,
    yPos,
    { align: "right" }
  );
  doc.text(`Total: ${data.length}`, 14, yPos);

  // ===== TABLE DATA =====
  const tableData = data.map((r, index) => {
    const formattedDate = r.date_time
      ? new Date(r.date_time).toISOString().slice(0, 16).replace("T", " ")
      : "-";
    const type = r.type === "inPerson" ? "استماع ولقاء" : "استماع";
    const paymentMethod =
      r.paymentMethod === "gateway"
        ? "بوابة دفع"
        : r.paymentMethod === "cash"
          ? "نقدا"
          : r.paymentMethod === "banktransfer"
            ? "تحويل بنكي"
            : "غير معروف";
    return [
      index + 1,
      r.name || "-",
      r.phone || "-",
      r.email || "-",
      formattedDate,
      type,
      paymentMethod,
      r.invoice_number || "-",
      r.invoice_pdf ? "متاح" : "غير متاح",
    ];
  });

  autoTable(doc, {
    startY: yPos + 10,
    head: [
      [
        "#",
        fixArabicText("الاسم / Name"),
        fixArabicText("الهاتف / Phone"),
        fixArabicText("البريد الإلكتروني / Email"),
        fixArabicText("التاريخ والوقت / Date & Time"),
        fixArabicText("نوع / Type"),
        fixArabicText("طريقة الدفع / Payment"),
        fixArabicText("رقم الفاتورة / Invoice No."),
        fixArabicText("الفاتورة / Invoice"),
      ],
    ],
    body: tableData,
    styles: {
      font: "Amiri",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
      halign: "center",
      valign: "middle",
      lineColor: [164, 211, 221],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [164, 211, 221],
      textColor: [33, 78, 120],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      minCellHeight: 12,
    },
    bodyStyles: {
      textColor: [33, 78, 120],
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50, halign: "left" },
      2: { cellWidth: 45 },
      3: { cellWidth: 70, halign: "left" },
      4: { cellWidth: 50 },
      5: { cellWidth: 50 },
      6: { cellWidth: 50 },
      7: { cellWidth: 50 },
      8: { cellWidth: 30 },
    },
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: function () {
      const pageCount = doc.getNumberOfPages();
      const currentPage = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(8);
      doc.setTextColor(150);

      doc.text(
        fixArabicText(`صفحة ${currentPage} من ${pageCount}`),
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    },
  });

  // ===== SAVE PDF =====
  const timestamp = today.getTime();
  const statusText = status ? `-${status}` : "";
  doc.save(`reservations${statusText}-${timestamp}.pdf`);
}

export default downloadReservationsPDF;
