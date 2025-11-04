import Image from "next/image";

export default function ContactUpPage() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-7 items-center">
      <div dir="ltr" className="flex items-center gap-2 justify-start">
        <Image
          src="/Images/email.svg"
          width={30}
          height={30}
          alt="email"
          className="bg-[#214E78] px-2 py-2 rounded-full"
        />
        <a
          href="mailto:Info@istifhamcompany.com"
          className="text-md hover:underline"
        >
          Info@istifhamcompany.com
        </a>
      </div>

      <div className="flex flex-col justify-center items-center">
        <div dir="ltr" className="flex items-center gap-2">
          <a href="tel:+966545938783">
            <Image
              src="/Images/phone.svg"
              width={30}
              height={30}
              alt="phone"
              className="bg-[#214E78] px-2 py-2 rounded-full"
            />
          </a>

          <a
            href="https://wa.me/966545938783"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/Images/whatsapp.svg"
              width={30}
              height={30}
              alt="whatsapp"
              className="bg-[#214E78] px-2 py-2 rounded-full"
            />
          </a>

          <a href="tel:+966545938783" className="text-md hover:underline">
            +966545938783
          </a>
        </div>
      </div>
    </div>
  );
}
