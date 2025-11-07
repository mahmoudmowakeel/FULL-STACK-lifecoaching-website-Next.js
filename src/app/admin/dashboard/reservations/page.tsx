"use client";
import { useEffect, useRef, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import ReservationsTable from "../_components/ReservationsTable";
import Image from "next/image";
import NormalButton from "../_UI/NormalButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminModal } from "../_components/ModalAdmin";
import DateTimePickerReserve from "@/app/[locale]/components/DateTimePicker_reserve";
import { ReservationFormData } from "@/lib/types/freeTrials";
import AdminDateTimePickerReserve from "../_components/ReservePicketForAdmin";

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

export default function ReservationsPage() {
  // ===== Add these states at the top =====
  const [editingReservationId, setEditingReservationId] = useState<
    number | null
  >(null);
  const [tempDateTime, setTempDateTime] = useState<string>("");
  const [originalDateTime, setOriginalDateTime] = useState<string>("");
  const [formData, setFormData] = useState<ReservationFormData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  // const handleModalCancel = () => {
  //   if (editingReservationId !== null) {
  //     setReservations((prev) =>
  //       prev.map((r) =>
  //         r.id === editingReservationId
  //           ? { ...r, date_time: originalDateTime }
  //           : r
  //       )
  //     );
  //   }
  //   setIsModalOpen(false);
  // };
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
  const [updating, setUpdating] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  // ✅ Update reservation and send mail if canceled or completed
  const updateReservationStatus = async (
    resv: Reservation,
    newStatus: "completed" | "canceled"
  ) => {
    setUpdating(resv.email);
    try {
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resv.email, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("❌ Failed to update:", data.error);
        alert(data.error || "Update failed");
        return;
      }
      let emailType: "cancel_reservation" | "complete_reservation" | null =
        null;
      if (newStatus === "canceled") emailType = "cancel_reservation";
      else if (newStatus === "completed") emailType = "complete_reservation";
      if (emailType) {
        try {
          await fetch("/api/send-general-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: resv.name,
              customerEmail: resv.email,
              type: emailType,
              date_time: resv.date_time,
            }),
          });
          console.log(`📩 ${emailType} email sent to ${resv.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send ${emailType} email:`, emailError);
        }
      }
      await fetchReservations();
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert("Network error while updating status");
    } finally {
      setUpdating(null);
    }
  };

  // Fetch completed reservations
  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/get-reservations");
      const data = await res.json();
      if (data.success) {
        const completedData = data.data
          .filter((r: Reservation) => r.status === "pending")
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
    doc.text("Reservations Report", 14, 20);
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

    doc.save(`reservations-${Date.now()}.pdf`);
  };

  // ===== Modal Logic =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);

  const openModalForReservation = (id: number) => {
    const reservation = filteredReservations.find((r) => r.id === id);
    if (!reservation) return;

    // Convert to ReservationFormData
    const converted: ReservationFormData = {
      email: reservation.email,
      name: reservation.name,
      phone: reservation.phone,
      date_time: reservation.date_time || "",
      paymentMethod: reservation.paymentMethod || "",
      payment_bill: reservation.payment_bill || "",
      type: reservation.type || "",
      amount: reservation.amount || "",
    };

    setFormData(converted);
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleModalDone = () => {
    // TODO: Save changes if needed later
    setIsModalOpen(false);
  };

  const handleSave = async (email: string, name: string) => {
    let formattedDate = formData?.date_time;
    if (formattedDate) {
      const date = new Date(formattedDate);
      formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
    try {
      // setIsSaving(true);
      const updatedData = {
        email,
        status: "pending",
        date_time: formattedDate,
      };
      const res = await fetch("/api/update-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const result = await res.json();
      if (!result.success) {
        alert("❌ Update failed.");
      } else {
        alert("✅ Updated successfully!");
        // setIsEditing(false);
      }

      const selectedDateISO = selectedDate
        ? new Date(
            selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
          )
            .toISOString()
            .split("T")[0]
        : "";

      const readySlot = [
        {
          date: selectedDateISO,
          time_slot: selectedTime,
          status: "booked",
        },
      ];
      const updateSlotResponse = await fetch(
        "/api/update_reservation_calendar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slots: readySlot,
          }),
        }
      );

      const updateSlotData = await updateSlotResponse.json();
      if (!updateSlotResponse.ok || !updateSlotData.success) {
        console.error("⚠️ Calendar update failed:", updateSlotData.error);
        throw new Error("فشل في تحديث التقويم.");
      }

      try {
        await fetch("/api/send-general-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name,
            customerEmail: email,
            type: "edit",
            date_time: formattedDate,
          }),
        });
        console.log(`📩 edit email sent to ${email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send edit email:`, emailError);
      }
    } catch (err) {
      console.error("❌ Error saving:", err);
      alert("Error while saving changes.");
    } finally {
      // setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="الحجوزات / Reservations"
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
            status="pending"
            selectedIds={selectedIds}
            toggleRow={toggleRow}
            toggleSelectAll={toggleSelectAll}
            downloadPDF={downloadPDF}
            updateReservationStatus={updateReservationStatus}
            openModalForReservation={openModalForReservation}
            handleSave={handleSave}
          />
        )}
      </ContentContainer>
      {isModalOpen && editingReservation && (
        <AdminModal isOpen={isModalOpen} onClose={closeModal}>
          <div className="text-[#214E78]">
            <AdminDateTimePickerReserve<ReservationFormData>
              formData={formData!} // safe because we set it before opening
              setFormData={
                setFormData as React.Dispatch<
                  React.SetStateAction<ReservationFormData>
                >
              }
              type="reservation"
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
            />
            <div className="flex justify-center gap-4 mt-6">
              <NormalButton
                bgColor="#FFFFFF"
                textColor="#214E78"
                onClick={closeModal}
              >
                إلغاء <br /> Cancel
              </NormalButton>
              <NormalButton
                bgColor="#214E78"
                textColor="#FFFFFF"
                onClick={handleModalDone}
              >
                تم <br /> Done
              </NormalButton>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
