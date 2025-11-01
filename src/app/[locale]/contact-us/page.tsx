import Image from "next/image";

export default function ContactUpPage() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-7 items-center">
      <div dir="ltr" className="flex  items-center gap-2 justify-start">
        <Image
          src="/Images/email.svg"
          width={30}
          height={30}
          alt="snap"
          className="bg-[#214E78] px-2 py-2 rounded-full"
        />
        <p className="text-md">Istifhamcompany@gmail.com</p>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div dir="ltr" className="flex  items-center gap-2">
          <Image
            src="/Images/phone.svg"
            width={30}
            height={30}
            alt="snap"
            className="bg-[#214E78] px-2 py-2 rounded-full"
          />
          <Image
            src="/Images/whatsapp.svg"
            width={30}
            height={30}
            alt="youtube"
            className="bg-[#214E78] px-2 py-2 rounded-full"
          />
          <p className="text-md">+966545938783</p>
        </div>
      </div>
    </div>
  );
}
