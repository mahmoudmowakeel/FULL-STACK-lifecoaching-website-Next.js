import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "شركة استفهام - Istifham Company",
  description:
    "استفهام شركة تهدف إلى تحسين وتعزيز جودة حياة الفرد من خلال الاستماع الهادف والبناء والتفاعل المحدود في لحظات مختارة تثري التجربة، دون تقديم أي نوع من الاستشارات الطبية أو النفسية أو القانونية أو المالية. هذا النشاط لا يُمارس في مقر رسمي، بل يُقدم إلكترونياً أو في مكان عام مختار يتوافق مع طبيعة النشاط.",
  icons: {
    icon: "https://www.istifhamcompany.com/Images/logo-ar.jpg"
  },
  openGraph: {
    title: "شركة استفهام - Istifham Company",
    description:
      "استفهام شركة تهدف إلى تحسين جودة حياة الفرد من خلال التفاعل الهادف وتجربة فريدة دون استشارات طبية أو قانونية.",
    url: "https://www.istifhamcompany.com",
    siteName: "Istifham Company",
    images: [
      {
        url: "https://www.istifhamcompany.com/Images/logo-ar.jpg", // 👈 place this image in /public/og-image.jpg
        width: 1200,
        height: 630,
        alt: "Istifham Company - شركة استفهام",
      },
    ],
    locale: "ar_AR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "شركة استفهام - Istifham Company",
    description:
      "استفهام: تجربة استماع هادفة ومميزة لتحسين جودة حياة الفرد في بيئة آمنة وملهمة.",
    images: ["https://www.istifhamcompany.com/Images/logo-ar.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
