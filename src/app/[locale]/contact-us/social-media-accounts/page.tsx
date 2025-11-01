"use client";
import Image from "next/image";
import Link from "next/link";

export default function SocialMediaAccountsPage() {
  return (
    <div className="flex justify-center items-center w-full" dir="ltr">
      <section className="flex justify-center gap-4">
        <Link
          href="https://youtube.com/@istifhamcompany?si=BwT1aeuZxnVWSNZp"
          target="_blank"
        >
          <Image
            src="/Images/youtube.svg"
            width={30}
            height={30}
            alt="youtube"
            unoptimized
            className="bg-[#214E78] px-2 py-2 rounded-full"
          />
        </Link>
        <Link
          href="https://x.com/Istifhamcompany?t=n92RC3xy9YMgZaL4jM4u2Q&s=08"
          target="_blank"
        >
          <Image
            src="/Images/x_social.svg"
            width={30}
            height={30}
            alt="x"
            unoptimized
            className="bg-[#214E78] px-2 py-2 rounded-full"
          />
        </Link>
        <Link
          href="https://www.snapchat.com/add/istifhamcompany?share_id=drI6FXWQqvo&locale=ar-AE"
          target="_blank"
        >
          <Image
            src="/Images/snapchat.svg"
            width={30}
            height={30}
            alt="snapchat"
            unoptimized
            className="bg-[#214E78] px-2 py-2 rounded-full"
          />
        </Link>
        <p>istifhamcompany</p>
      </section>
    </div>
  );
}
