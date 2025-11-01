import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import NavBar from "./components/NavBar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  console.log("] locale:", locale);

  let messages;
  try {
    messages = (await import(`../locales/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }

  console.log("Loaded locale:", messages);
  console.log("Messages keys:", Object.keys(messages));
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NavBar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Add this at the bottom of your layout file
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "ar" },
  ];
}
