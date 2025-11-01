"use client";
import { useEffect, useRef, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import ApplicationsTable from "../_components/ApplicationTable";
import NormalButton from "../_UI/NormalButton";
import Image from "next/image";

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
  const [filteredApplications, setFilteredApplications] = useState<HiringApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
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

    setFilteredApplications(result);
  }, [nameFilter, emailFilter, dateFilter, applications]);

  // ✅ Click outside closes popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
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

  // ✅ Handle delete / update actions
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

  return (
    <div dir="rtl" className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="طلبات التوظيف / Applications"
      >
        {/* === Funnel Icon & Filter Popup === */}
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

        {/* === Applications Table === */}
        <ApplicationsTable>
          <ApplicationsTable.TableHeader>
            <ApplicationsTable.TableHeader.TableCoulmn>#</ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              الاسم <br /> Name
            </ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              رقم الهاتف <br /> Phone Number
            </ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              البريد الالكتروني <br /> Email Address
            </ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              الوقت و التاريخ <br /> Date & Time
            </ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              المفكره <br /> Note
            </ApplicationsTable.TableHeader.TableCoulmn>
            <ApplicationsTable.TableHeader.TableCoulmn>
              <NormalButton textColor="#FFFFFF" bgColor="#214E78">
                PDF
                <Image
                  src="/Images/file-down.svg"
                  width={20}
                  height={20}
                  alt="pdf"
                />
              </NormalButton>
            </ApplicationsTable.TableHeader.TableCoulmn>
          </ApplicationsTable.TableHeader>

          <ApplicationsTable.TableContent>
            {loading && (
              <p className="text-white text-center py-4">
                جاري تحميل البيانات ...
              </p>
            )}

            {!loading && filteredApplications.length === 0 && (
              <p className="text-white text-center py-4">
                لا توجد نتائج تطابق الفلترة الحالية
              </p>
            )}

            {filteredApplications.map((app) => (
              <ApplicationsTable.TableContent.TableContentRow
                data={app}
                key={app.id}
              >
                <NormalButton
                  bgColor="#214E78"
                  textColor="#FFFFFF"
                  disabled={actionLoading === app.id}
                  onClick={() => handleAction(app.id, "delete")}
                >
                  {actionLoading === app.id ? "..." : "حذف"} <br />
                  {actionLoading === app.id ? "" : "Remove"}
                </NormalButton>

                <NormalButton
                  bgColor="#FFFFFF"
                  textColor="#214E78"
                  disabled={actionLoading === app.id}
                  onClick={() => handleAction(app.id, "update", "completed")}
                >
                  {actionLoading === app.id ? "..." : "تواصل"} <br />
                  {actionLoading === app.id ? "" : "Contact"}
                </NormalButton>
              </ApplicationsTable.TableContent.TableContentRow>
            ))}
          </ApplicationsTable.TableContent>
        </ApplicationsTable>
      </ContentContainer>
    </div>
  );
}
