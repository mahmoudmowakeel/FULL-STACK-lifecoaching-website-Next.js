"use client";
import Image from "next/image";
import ContentContainer from "../_UI/ContentContainer";
import NormalButton from "../_UI/NormalButton";
import FreeTrialsTable from "../_components/FreeTrialsTable";
import { useEffect, useState, useRef } from "react";

export interface FreeTrial {
  id: number;
  name: string;
  phone: string;
  email: string;
  date_time: string | null;
  status: string;
}

export default function CompletedFreeTrialsPage() {
  const [freeTrials, setFreeTrials] = useState<FreeTrial[]>([]);
  const [filteredTrials, setFilteredTrials] = useState<FreeTrial[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter UI states
  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch data
  const fetchFreeTrials = async () => {
    try {
      const res = await fetch("/api/get-free-trials");
      const data = await res.json();

      if (data.success) {
        const filteredData = data.data
          .filter((trial: FreeTrial) => trial.status === "completed")
          .sort((a: FreeTrial, b: FreeTrial) => a.id - b.id);

        setFreeTrials(filteredData);
        setFilteredTrials(filteredData);
      } else {
        console.error("❌ Failed to fetch free trials:", data.error);
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

  // ✅ Filtering logic
  useEffect(() => {
    let result = freeTrials;

    if (nameFilter.trim()) {
      result = result.filter((t) =>
        t.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (emailFilter.trim()) {
      result = result.filter((t) =>
        t.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    if (dateFilter.trim()) {
      result = result.filter(
        (t) =>
          t.date_time &&
          t.date_time.toLowerCase().includes(dateFilter.toLowerCase())
      );
    }

    setFilteredTrials(result);
  }, [nameFilter, emailFilter, dateFilter, freeTrials]);

  // ✅ Close filter when clicking outside
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

  // ✅ Reset filters
  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setDateFilter("");
    setFilteredTrials(freeTrials);
  };

  return (
    <div className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="التجارب المجانيه المنجزه / Completed Free Trials"
      >
        {/* === Funnel icon always visible === */}
        <div className="relative flex justify-end pr-4 mb-2">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter((prev) => !prev)}
              className="focus:outline-none"
            >
              <Image
                src="/Images/funnel.svg"
                width={24}
                height={24}
                className="inline-block text-[#A4D3DD]"
                alt="funnel"
              />
            </button>

            {/* === Floating Filter Box === */}
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
                      الوقت و التاريخ / Date
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

        {/* === Table === */}
        {loading ? (
          <div className="w-full text-center">
            <p className="text-white w-full p-5 text-2xl mx-auto text-center">
              جاري تحميل البيانات ...
            </p>
          </div>
        ) : filteredTrials.length === 0 ? (
          <div className="w-full text-center">
            <p className="text-white w-full p-5 text-2xl mx-auto text-center">
              لا توجد نتائج تطابق الفلترة الحالية
            </p>
          </div>
        ) : (
          <FreeTrialsTable>
            <FreeTrialsTable.TableHeader>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                #
              </FreeTrialsTable.TableHeader.TableCoulmn>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                الاسم <br /> Name
              </FreeTrialsTable.TableHeader.TableCoulmn>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                رقم الهاتف <br /> Phone Number
              </FreeTrialsTable.TableHeader.TableCoulmn>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                البريد الالكتروني <br /> Email Address
              </FreeTrialsTable.TableHeader.TableCoulmn>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                الوقت و التاريخ <br /> Date & Time
              </FreeTrialsTable.TableHeader.TableCoulmn>
              <FreeTrialsTable.TableHeader.TableCoulmn>
                <NormalButton textColor="#FFFFFF" bgColor="#214E78">
                  PDF
                  <Image
                    src="/Images/file-down.svg"
                    width={20}
                    height={20}
                    alt="pdf"
                  />
                </NormalButton>
              </FreeTrialsTable.TableHeader.TableCoulmn>
            </FreeTrialsTable.TableHeader>

            <FreeTrialsTable.TableContent>
              {filteredTrials.map((trial, index) => (
                <FreeTrialsTable.TableContent.TableContentRow
                  data={trial}
                  key={trial.id}
                  index={index}
                  status = "completed"
                />
              ))}
            </FreeTrialsTable.TableContent>
          </FreeTrialsTable>
        )}
      </ContentContainer>
    </div>
  );
}
