import Image from "next/image";
import Link from "next/link";
import NavButton from "../_UI/NavButton";

export default function NavBar() {
  return (
    <aside className="w-64 bg-transparent text-white flex flex-col justify-between items-center py-8">
      <section className="w-full [direction:ltr]   overflow-auto h-[85vh] my-7 py-5">
        <ul className="flex flex-col gap-2 w-full px-4">
          <li>
            <Link href="/admin/dashboard/free-trials">
              <NavButton>
                التجارب المجانيه <br /> Free Trials
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/completed-free-trials">
              <NavButton>
                التجارب المجانيه المنجزه <br /> Completed Free Trials
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/free-trials-calendar">
              <NavButton>
                التجارب المجانيه / التقويم <br /> Free Trials / Calendar
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/reservations">
              <NavButton>
                الحجوزات <br /> Reservations
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/completed-reservations">
              <NavButton>
                الحجوزات المنجزه <br /> Completed Reservations
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/canceled-reservations">
              <NavButton>
                الحجوزات الملغيه <br /> Canceled Reservations
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/reservations-calendar">
              <NavButton>
                الحجوزات / التقويم <br /> Reservations / Calendar
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/listen-meet">
              <NavButton>
                استماع / استماع ولقاء <br /> Listen / Listen and Meet
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/hiring">
              <NavButton>
                التوظيف <br /> Hiring
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/applications">
              <NavButton>
                طلبات التوظيف <br /> Applications
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/completed-applications">
              <NavButton>
                طلبات التوظيف المنجزه <br /> Completed applications
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/reserve">
              <NavButton>
                الحجز <br /> Reservation
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/edit-customer-data">
              <NavButton>
                تعديل بيانات العميل <br /> Edit Customer Data
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/primary-messages">
              <NavButton>
                الرسائل الاساسيه <br /> Primary Messages
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/secondary-messages">
              <NavButton>
                الرسائل الثانويه <br /> Secondary Messages
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/notes">
              <NavButton>
                الملاحظات <br /> Notes
              </NavButton>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/create-admin">
              <NavButton>
                تعيين ادمن <br /> Assign Admin
              </NavButton>
            </Link>
          </li>
        </ul>
      </section>
    </aside>
  );
}
