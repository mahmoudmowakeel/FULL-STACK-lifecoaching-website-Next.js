import Image from "next/image";
import NormalButton from "../_UI/NormalButton";
import { HiringApplication } from "../applications/page";

export default function ApplicationsTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <table className="min-w-full border-collapse text-[#214E78] text-center font-bold text-xs">
        {children}
      </table>
    </div>
  );
}

/* ------------------ HEADER ------------------ */
function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#A4D3DD] text-[#214E78]">
      <tr className="rounded-2xl">{children}</tr>
    </thead>
  );
}

/* ------------------ HEADER COLUMN ------------------ */
function TableColumn({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-xs">{children}</th>;
}

/* ------------------ BODY ------------------ */
function TableContent({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="text-[#214E78] font-semibold overflow-auto">
      {children}
    </tbody>
  );
}

/* ------------------ ROW ------------------ */
function TableContentRow({
  children,
  data,
}: {
  children?: React.ReactNode;
  data: HiringApplication;
}) {
  const date = new Date(new Date(data.created_at as string));
  const formatted = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  return (
    <tr className="bg-[#A4D3DD] h-fit text-[0.6rem]">
      <td className="px-4 py-2 h-fit">{data.id}</td>
      <td className="px-4 py-2 h-fit">{data.name}</td>
      <td className="px-4 py-2 h-fit">{data.phone}</td>
      <td className="px-4 py-2 h-fit">{data.email}</td>
      <td className="px-4 py-2 h-fit">{formatted}</td>
      <td className="px-4 py-2 h-fit">{data.message}</td>
      <td className="px-4 py-2 h-fit mx-auto">
        <div dir="ltr" className="flex justify-center gap-2">
          {children}
        </div>
      </td>
    </tr>
  );
}

/* ------------------ STRUCTURE ATTACHMENTS ------------------ */
TableHeader.TableCoulmn = TableColumn;
TableContent.TableContentRow = TableContentRow;

ApplicationsTable.TableHeader = TableHeader;
ApplicationsTable.TableContent = TableContent;
