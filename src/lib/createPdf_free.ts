import { FreeTrial } from "@/app/admin/dashboard/free-trials/page";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import { reshape } from "arabic-persian-reshaper";
import { bidi } from "bidi-js";

// ✅ Load your Arabic-supporting font (Amiri)
const AMIRI_BASE64 = fs.readFileSync("public/fonts/Amiri-Regular.ttf", "base64");

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
 * Downloads table data as a bilingual PDF (Arabic + English)
 */
export function downloadTableAsPDF(data: FreeTrial[], status?: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  // ✅ Register Amiri font for Arabic text
  doc.addFileToVFS("Amiri-Regular.ttf", AMIRI_BASE64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");

  // ====== HEADER ======
  doc.setFontSize(20);
  doc.setTextColor(33, 78, 120); // #214E78

  // Titles
  doc.text(fixArabicText("تقرير التجارب المجانية"), doc.internal.pageSize.width - 14, 20, {
    align: "right",
  });
  doc.text("Free Trials Report", 14, 20);

  // ====== METADATA ======
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);

  const today = new Date();
  const arabicDate = today.toLocaleDateString("ar-EG");
  const englishDate = today.toLocaleDateString("en-US");

  // Dates
  doc.text(fixArabicText(`تاريخ: ${arabicDate}`), doc.internal.pageSize.width - 14, 28, { align: "right" });
  doc.text(`Date: ${englishDate}`, 14, 28);

  let yPos = 34;

  // Status
  if (status) {
    const statusMap: Record<string, string> = {
      pending: "قيد الانتظار",
      completed: "مكتمل",
      cancelled: "ملغى",
    };
    const statusArabic = statusMap[status] || status;

    doc.text(fixArabicText(`الحالة: ${statusArabic}`), doc.internal.pageSize.width - 14, yPos, { align: "right" });
    doc.text(`Status: ${status}`, 14, yPos);
    yPos += 6;
  }

  // Total
  doc.text(fixArabicText(`المجموع: ${data.length}`), doc.internal.pageSize.width - 14, yPos, { align: "right" });
  doc.text(`Total: ${data.length}`, 14, yPos);

  // ====== TABLE ======
  const tableData = data.map((item, index) => {
    let formattedDateTime = "";
    if (item.date_time) {
      const date = new Date(item.date_time);
      formattedDateTime = date.toISOString().slice(0, 16).replace("T", " ");
    }

    return [
      index + 1,
      item.name || "-",
      item.phone || "-",
      item.email || "-",
      formattedDateTime || "-",
    ];
  });

  autoTable(doc, {
    startY: yPos + 10,
    head: [[
      "#",
      fixArabicText("الاسم / Name"),
      fixArabicText("الهاتف / Phone"),
      fixArabicText("البريد الإلكتروني / Email"),
      fixArabicText("التاريخ والوقت / Date & Time"),
    ]],
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
      fillColor: [164, 211, 221], // #A4D3DD
      textColor: [33, 78, 120],   // #214E78
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      minCellHeight: 12,
    },

    bodyStyles: {
      textColor: [33, 78, 120],
      fontSize: 9,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 50, halign: "left" },
      2: { cellWidth: 45, halign: "center" },
      3: { cellWidth: 70, halign: "left" },
      4: { cellWidth: 50, halign: "center" },
    },

    margin: { top: 10, left: 14, right: 14 },

    // Footer
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

  // ====== SAVE PDF ======
  const timestamp = today.getTime();
  const statusText = status ? `-${status}` : "";
  const fileName = `free-trials${statusText}-${timestamp}.pdf`;

  doc.save(fileName);
}

export default downloadTableAsPDF;
