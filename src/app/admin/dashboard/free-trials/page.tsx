"use client";
import Image from "next/image";
import ContentContainer from "../_UI/ContentContainer";
import NormalButton from "../_UI/NormalButton";
import FreeTrialsTable from "../_components/FreeTrialsTable";
import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Modal } from "@/app/[locale]/components/Modal";
import { AdminModal } from "../_components/ModalAdmin";
import DateTimePicker from "@/app/[locale]/components/DateTimePicker";
import { FreeTrialFormData } from "@/lib/types/freeTrials";
import AdminFreeDateTimePicker from "../_components/FreePickForAdmin";

export interface FreeTrial {
  id: number;
  name: string;
  phone: string;
  email: string;
  date_time: string | null;
  status: string;
}

export default function FreeTrialsPage() {
  const [freeTrials, setFreeTrials] = useState<FreeTrial[]>([]);
  const [filteredTrials, setFilteredTrials] = useState<FreeTrial[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // ================= Modal & Editing Logic =================
  const [editingTrialId, setEditingTrialId] = useState<number | null>(null);
  const [tempDateTime, setTempDateTime] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originalDateTime, setOriginalDateTime] = useState<string>("");
  const [formData, setFormData] = useState<FreeTrialFormData>({
    name: "", // Always required field
    phone: "", // Optional, can be an empty string or null
    email: "", // Optional, can be an empty string or null
    date_time: null, // Optional, will use the current timestamp if not provided
    status: "pending", // Optional, default will be 'pending' in the DB
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  const openModalForTrial = (trialId: number, currentDate: string | null) => {
    setEditingTrialId(trialId);
    setTempDateTime(currentDate || "");
    setOriginalDateTime(currentDate || "");
    setIsModalOpen(true);
  };

  const handleModalDone = () => {
    if (editingTrialId !== null) {
      setFreeTrials((prev) =>
        prev.map((t) =>
          t.id === editingTrialId ? { ...t, date_time: tempDateTime } : t
        )
      );
    }
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    if (editingTrialId !== null) {
      setFreeTrials((prev) =>
        prev.map((t) =>
          t.id === editingTrialId ? { ...t, date_time: originalDateTime } : t
        )
      );
    }
    setIsModalOpen(false);
  };
  // ==========================================================

  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTrials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrials.map((t) => t.id));
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const fontBase64 = localStorage.getItem("amiriFont");

    if (fontBase64) {
      try {
        doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");
        console.log("Font applied to PDF");
      } catch (error) {
        console.error("Error applying font:", error);
      }
    } else {
      console.warn("Font not loaded from localStorage");
    }

    doc.setFontSize(18);
    doc.text("Free Trials Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Status: Pending`, 14, 34);

    const selected = selectedIds.length
      ? filteredTrials.filter((t) => selectedIds.includes(t.id))
      : filteredTrials;

    doc.text(`Total Records: ${selected.length}`, 14, 40);

    const tableData = selected.map((item, index) => {
      const dateStr = item.date_time
        ? new Date(item.date_time).toISOString().slice(0, 16).replace("T", " ")
        : "";
      return [index + 1, item.name, item.phone, item.email, dateStr];
    });

    autoTable(doc, {
      startY: 46,
      head: [["#", "Name", "Phone", "Email", "Date & Time"]],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        font: "Amiri",
        halign: "right",
      },
      headStyles: {
        fillColor: [164, 211, 221],
        textColor: [33, 78, 120],
        fontStyle: "bold",
        font: "Amiri",
      },
    });

    doc.save(`free-trials-pending-${Date.now()}.pdf`);
  };

  const fetchFreeTrials = async () => {
    try {
      const res = await fetch("/api/get-free-trials");
      const data = await res.json();
      if (data.success) {
        const filteredData = data.data
          .filter((trial: FreeTrial) => trial.status === "pending")
          .sort((a: FreeTrial, b: FreeTrial) => a.id - b.id);

        setFreeTrials(filteredData);
        setFilteredTrials(filteredData);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreeTrials();
  }, []);

  useEffect(() => {
    let result = freeTrials;
    if (nameFilter.trim())
      result = result.filter((t) =>
        t.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    if (emailFilter.trim())
      result = result.filter((t) =>
        t.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    if (dateFilter.trim())
      result = result.filter(
        (t) =>
          t.date_time &&
          t.date_time.toLowerCase().includes(dateFilter.toLowerCase())
      );
    if (phoneFilter.trim())
      result = result.filter(
        (t) =>
          t.phone && t.phone.toLowerCase().includes(phoneFilter.toLowerCase())
      );
    setFilteredTrials(result);
    setSelectedIds([]);
  }, [nameFilter, emailFilter, dateFilter, freeTrials, phoneFilter]);

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

  const handleComplete = async (id: number) => {
    try {
      const res = await fetch("/api/update-free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      const data = await res.json();
      if (data.success) {
        setFreeTrials((prev) => prev.filter((t) => t.id !== id));
        setFilteredTrials((prev) => prev.filter((t) => t.id !== id));
        setSelectedIds((prev) => prev.filter((x) => x !== id));
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  };
  const handleSave = async (id: number, name: string, email: string) => {
    let formattedDate = formData.date_time;
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
      const res = await fetch("/api/update-free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          date_time: formattedDate,
          status: "pending",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFreeTrials((prev) => prev.filter((t) => t.id !== id));
        setFilteredTrials((prev) => prev.filter((t) => t.id !== id));
        setSelectedIds((prev) => prev.filter((x) => x !== id));
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
      const updateSlotResponse = await fetch("/api/update_freeTrial_calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slots: readySlot,
        }),
      });

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
        console.log(`📩 edit email sent to `);
      } catch (emailError) {
        console.error(`❌ Failed to send edit email:`, emailError);
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  };

  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setDateFilter("");
    setFilteredTrials(freeTrials);
    setSelectedIds([]);
  };

  return (
    <div className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="التجارب المجانيه / Free Trials"
      >
        {/* === Filter === */}
        <div className="relative flex justify-end pr-4 mb-2" ref={filterRef}>
          <button onClick={() => setShowFilter((p) => !p)}>
            <Image
              src="/Images/funnel.svg"
              width={24}
              height={24}
              alt="funnel"
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

        {/* === Table === */}
        {loading ? (
          <p className="text-white text-center p-5 text-2xl">
            جاري تحميل البيانات ...
          </p>
        ) : filteredTrials.length === 0 ? (
          <p className="text-white text-center p-5 text-2xl">
            لا توجد نتائج تطابق الفلترة الحالية
          </p>
        ) : (
          <FreeTrialsTable
            data={filteredTrials}
            selectedIds={selectedIds}
            toggleRow={toggleRow}
            toggleSelectAll={toggleSelectAll}
            handleComplete={handleComplete} // must exist!
            downloadPDF={downloadPDF}
            openModalForTrial={openModalForTrial} // NEW PROP
            status="pending"
            handleSave={handleSave}
          />
        )}

        {/* === Modal for Date/Time Picking === */}
        <AdminModal isOpen={isModalOpen} onClose={handleModalCancel}>
          <AdminFreeDateTimePicker<FreeTrialFormData>
            formData={formData}
            setFormData={setFormData}
            type="free_trial"
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />
          <div className="flex justify-between gap-3.5 mx-auto w-[50%]">
            <button
              className="mt-4 w-[50%] text-[#214E78] bg-white p-1 rounded-md cursor-pointer"
              onClick={handleModalDone}
            >
              حفظ <br /> Save
            </button>
            <button
              className="mt-4 w-[50%] bg-[#214E78] text-white p-1 rounded-md cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              تراجع <br /> cancel
            </button>
          </div>
        </AdminModal>
      </ContentContainer>
    </div>
  );
}
