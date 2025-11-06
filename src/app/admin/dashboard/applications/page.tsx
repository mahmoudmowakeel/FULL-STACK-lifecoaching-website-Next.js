"use client";
import { useEffect, useRef, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import NormalButton from "../_UI/NormalButton";
import Image from "next/image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ApplicationsTable from "../_components/ApplicationTable";

export interface HiringApplication {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<HiringApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    HiringApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ✅ toggle logic
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filters
  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch pending applications
  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/get-hiring-applications");
      const data = await res.json();

      if (data.success) {
        const filteredData = data.data
          .filter((app: HiringApplication) => app.status === "pending")
          .sort((a: HiringApplication, b: HiringApplication) => a.id - b.id);
        setApplications(filteredData);
        setFilteredApplications(filteredData);
      } else {
        console.error("❌ Failed to fetch applications:", data.error);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ✅ Handle filters
  useEffect(() => {
    let result = applications;

    if (nameFilter.trim()) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (emailFilter.trim()) {
      result = result.filter((a) =>
        a.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    if (dateFilter.trim()) {
      result = result.filter((a) =>
        a.created_at.toLowerCase().includes(dateFilter.toLowerCase())
      );
    }
    if (phoneFilter.trim())
      result = result.filter(
        (t) =>
          t.phone && t.phone.toLowerCase().includes(phoneFilter.toLowerCase())
      );

    setFilteredApplications(result);
  }, [nameFilter, emailFilter, dateFilter, applications, phoneFilter]);

  // ✅ Click outside closes popup
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

  // ✅ Clear filters
  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setDateFilter("");
    setFilteredApplications(applications);
  };

  // ✅ Handle delete / update actions (same as before)
  const handleAction = async (
    id: number,
    action: "delete" | "update",
    status?: string
  ) => {
    setActionLoading(id);

    try {
      const res = await fetch("/api/update-hiring-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, ...(status && { status }) }),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("❌ Action failed:", data.error);
        return;
      }

      await fetchApplications();
    } catch (err) {
      console.error("❌ Error performing action:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Toggle logic
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApplications.length) setSelectedIds([]);
    else setSelectedIds(filteredApplications.map((a) => a.id));
  };

  // ✅ PDF Download
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Hiring Applications Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Status: Pending`, 14, 34);

    const selected = selectedIds.length
      ? filteredApplications.filter((a) => selectedIds.includes(a.id))
      : filteredApplications;

    doc.text(`Total Records: ${selected.length}`, 14, 40);

    const tableData = selected.map((a, i) => [
      i + 1,
      a.name,
      a.phone,
      a.email,
      a.message,
      new Date(a.created_at).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 46,
      head: [["#", "Name", "Phone", "Email", "Message", "Date"]],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [164, 211, 221],
        textColor: [33, 78, 120],
        fontStyle: "bold",
      },
    });

    doc.save(`applications-pending-${Date.now()}.pdf`);
  };

  return (
    <div dir="rtl" className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="طلبات التوظيف / Applications"
      >
        {/* === Filter Popup === */}
        <div className="relative flex justify-end pr-4 mb-2">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter((prev) => !prev)}
              className="focus:outline-none"
            >
              <Image
                src="/Images/funnel.svg"
                width={26}
                height={26}
                className="inline-block text-[#A4D3DD]"
                alt="filter funnel"
              />
            </button>

            {showFilter && (
              <div className="absolute left-0 mt-2 bg-[#A4D3DD] text-[#214E78] rounded-xl shadow-lg p-4 w-64 z-50">
                <h3 className="text-sm font-bold mb-2 text-center">
                  تصفية النتائج / Filter
                </h3>

                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <label className="font-semibold text-xs">
                      الاسم / Name
                    </label>
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
        </div>

        {/* ✅ Applications Table with Toggle + PDF */}
        <ApplicationsTable data={filteredApplications} status="pending">
          {filteredApplications.map((app, index) => (
            <div key={app.id} className="flex gap-2 justify-center">
              <button
                className="bg-[#214E78] text-white px-4 text-[10px] rounded-2xl w-full disabled:opacity-50 cursor-pointer"
                disabled={actionLoading === app.id}
                onClick={() => handleAction(app.id, "delete")}
              >
                {actionLoading === app.id ? (
                  "..."
                ) : (
                  <>
                    حذف <br />
                    <span className="text-[10px] font-light mb-[9px] inline">
                      Remove
                    </span>
                  </>
                )}
              </button>

              <button
                className="bg-white text-[#214E78]  text-[10px]  px-4 rounded-2xl w-full disabled:opacity-50 cursor-pointer"
                disabled={actionLoading === app.id}
                onClick={() => handleAction(app.id, "update", "completed")}
              >
                {actionLoading === app.id ? (
                  "..."
                ) : (
                  <>
                    تواصل <br />
                    <span className="text-[10px] font-light">Contact</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </ApplicationsTable>
      </ContentContainer>
    </div>
  );
}
