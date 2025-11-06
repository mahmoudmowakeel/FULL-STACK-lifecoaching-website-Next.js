"use client";
import { useEffect, useRef, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import ReservationsTable from "../_components/ReservationsTable";
import Image from "next/image";
import NormalButton from "../_UI/NormalButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Reservation {
  id: number;
  name: string;
  phone: string;
  email: string;
  date_time: string | null;
  status: string;
  payment_bill: string;
  paymentMethod: string;
  type: string;
  amount: string;
  created_at: string;
  invoice_number: string;
  invoice_pdf: string | null;
}

export default function CompletedReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);

  // Fetch completed reservations
  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/get-reservations");
      const data = await res.json();
      if (data.success) {
        const completedData = data.data
          .filter((r: Reservation) => r.status === "completed")
          .sort((a: Reservation, b: Reservation) => a.id - b.id);
        setReservations(completedData);
        setFilteredReservations(completedData);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = reservations;
    if (nameFilter.trim()) {
      result = result.filter((r) =>
        r.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (emailFilter.trim()) {
      result = result.filter((r) =>
        r.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }
    if (dateFilter.trim()) {
      result = result.filter(
        (r) =>
          r.date_time &&
          r.date_time.toLowerCase().includes(dateFilter.toLowerCase())
      );
      if (phoneFilter.trim())
        result = result.filter(
          (t) =>
            t.phone && t.phone.toLowerCase().includes(phoneFilter.toLowerCase())
        );
    }
    setFilteredReservations(result);
    setSelectedIds([]);
  }, [nameFilter, emailFilter, dateFilter, reservations, phoneFilter]);

  // Click outside filter to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear filters
  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setDateFilter("");
    setFilteredReservations(reservations);
    setSelectedIds([]);
  };

  // Row selection
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReservations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReservations.map((r) => r.id));
    }
  };

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("Completed Reservations Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const selected = selectedIds.length
      ? filteredReservations.filter((r) => selectedIds.includes(r.id))
      : filteredReservations;

    doc.text(`Total Records: ${selected.length}`, 14, 34);

    const tableData = selected.map((r, i) => {
      const dateStr = r.date_time
        ? new Date(r.date_time).toISOString().slice(0, 16).replace("T", " ")
        : "";
      return [
        i + 1,
        r.name,
        r.phone,
        r.email,
        dateStr,
        r.type === "inPerson" ? "استماع ولقاء" : "استماع",
        r.paymentMethod === "gateway"
          ? "بوابة دفع"
          : r.paymentMethod === "cash"
          ? "نقدا"
          : r.paymentMethod === "banktransfer"
          ? "تحويل بنكي"
          : "غير معروف",
        r.invoice_number || "-",
        r.invoice_pdf ? "Available" : "N/A",
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "#",
          "Name",
          "Phone",
          "Email",
          "Date & Time",
          "Type",
          "Payment",
          "Invoice #",
          "Invoice",
        ],
      ],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [164, 211, 221], textColor: [33, 78, 120] },
    });

    doc.save(`completed-reservations-${Date.now()}.pdf`);
  };

  return (
    <div className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="الحجوزات المنجزة / Completed Reservations"
      >
        {/* Filter */}
        <div className="relative flex justify-end pr-4 mb-2" ref={filterRef}>
          <button onClick={() => setShowFilter((prev) => !prev)}>
            <Image
              src="/Images/funnel.svg"
              width={26}
              height={26}
              alt="filter"
            />
          </button>
          {showFilter && (
            <div className="absolute left-0 mt-2 bg-[#A4D3DD] text-[#214E78] rounded-xl shadow-lg p-4 w-64 z-50">
              <h3 className="text-sm font-bold mb-2 text-center">
                تصفية النتائج / Filter
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div>
                  <label className="font-semibold text-xs">الاسم / Name</label>
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full p-1 rounded-md text-[#214E78] focus:outline-none text-xs"
                    placeholder="ابحث بالاسم"
                  />
                </div>

                <div>
                  <label className="font-semibold text-xs">
                    البريد الإلكتروني / Email
                  </label>
                  <input
                    type="email"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full p-1 rounded-md text-[#214E78] focus:outline-none text-xs"
                    placeholder="ابحث بالبريد"
                  />
                </div>

                <div>
                  <label className="font-semibold text-xs">
                    التاريخ / Date
                  </label>
                  <input
                    type="text"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-1 rounded-md text-[#214E78] focus:outline-none text-xs"
                    placeholder="ابحث بالتاريخ"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs">
                    الهاتف / Phone
                  </label>
                  <input
                    type="text"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="w-full p-1 rounded-md text-[#214E78] focus:outline-none text-xs"
                    placeholder="ابحث بالتاريخ"
                  />
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <NormalButton
                  bgColor="#214E78"
                  textColor="#FFFFFF"
                  onClick={() => setShowFilter(false)}
                >
                  اغلاق <br /> Close
                </NormalButton>
                <NormalButton
                  bgColor="#FFFFFF"
                  textColor="#214E78"
                  onClick={clearFilters}
                >
                  مسح <br /> Clear
                </NormalButton>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-white text-center p-5 text-2xl">
            جاري تحميل البيانات ...
          </p>
        ) : filteredReservations.length === 0 ? (
          <p className="text-white text-center p-5 text-2xl">
            لا توجد نتائج تطابق الفلترة الحالية
          </p>
        ) : (
          <ReservationsTable
            data={filteredReservations}
            status="completed"
            selectedIds={selectedIds}
            toggleRow={toggleRow}
            toggleSelectAll={toggleSelectAll}
            downloadPDF={downloadPDF}
          />
        )}
      </ContentContainer>
    </div>
  );
}
