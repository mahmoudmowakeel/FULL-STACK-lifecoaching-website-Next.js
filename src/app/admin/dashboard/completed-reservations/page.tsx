"use client";
import { useEffect, useRef, useState } from "react";
import ContentContainer from "../_UI/ContentContainer";
import ReservationsTable from "../_components/ReservationsTable";
import Image from "next/image";
import NormalButton from "../_UI/NormalButton";

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
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch data from the API
  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/get-reservations");
      const data = await res.json();

      if (data.success) {
        const filteredData = data.data
          .filter((r: Reservation) => r.status === "completed")
          .sort((a: Reservation, b: Reservation) => a.id - b.id);

        setReservations(filteredData);
        setFilteredReservations(filteredData);
      } else {
        console.error("❌ Failed to fetch reservations:", data.error);
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

  // ✅ Apply filters
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
    }

    setFilteredReservations(result);
  }, [nameFilter, emailFilter, dateFilter, reservations]);

  // ✅ Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
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
    setFilteredReservations(reservations);
  };

  return (
    <div className="relative">
      <ContentContainer
        color="rgba(33, 78, 120, 0.7)"
        title="الحجوزات المنجزة / Completed Reservations"
      >
        {/* === Funnel filter icon always visible === */}
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

            {/* === Floating filter popup === */}
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
        ) : filteredReservations.length === 0 ? (
          <div className="w-full text-center">
            <p className="text-white w-full p-5 text-2xl mx-auto text-center">
              لا توجد نتائج تطابق الفلترة الحالية
            </p>
          </div>
        ) : (
          <ReservationsTable>
            {/* === Table Header === */}
            <ReservationsTable.TableHeader>
              <ReservationsTable.TableHeader.TableCoulmn>#</ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                الاسم <br /> Name
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                رقم الهاتف <br /> Phone Number
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                البريد الالكتروني <br /> Email Address
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                الوقت و التاريخ <br /> Date & Time
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                استماع / استماع ولقاء <br /> Listen / Meet
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                طريقة الدفع <br /> Payment Method
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                رقم الفاتورة <br /> Invoice Number
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                الفاتورة <br /> Invoice
              </ReservationsTable.TableHeader.TableCoulmn>
              <ReservationsTable.TableHeader.TableCoulmn>
                <NormalButton textColor="#FFFFFF" bgColor="#214E78">
                  PDF
                  <Image
                    src="/Images/file-down.svg"
                    width={20}
                    height={20}
                    alt="pdf"
                  />
                </NormalButton>
              </ReservationsTable.TableHeader.TableCoulmn>
            </ReservationsTable.TableHeader>

            {/* === Table Content === */}
            <ReservationsTable.TableContent>
              {filteredReservations.map((r, index) => (
                <ReservationsTable.TableContent.TableContentRow
                  data={r}
                  key={r.id}
                  index={index}
                  status="completed"
                ></ReservationsTable.TableContent.TableContentRow>
              ))}
            </ReservationsTable.TableContent>
          </ReservationsTable>
        )}
      </ContentContainer>
    </div>
  );
}
