import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import WhatsAppSupport from "@/components/shared/WhatsAppSupport/WhatsAppSupport";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "بايرز - منصة التجارة الإلكترونية الشاملة",
    template: "%s | بايرز"
  },
  description: "المنصة الرائدة لإنشاء وإدارة المتاجر الإلكترونية في اليمن. ابدأ تجارتك الآن بكل سهولة واحترافية.",
  keywords: ["تجارة إلكترونية", "اليمن", "متاجر", "بيع أونلاين", "بايرز", "Buyers", "E-commerce Yemen"],
  authors: [{ name: "Buyers Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    type: "website",
    locale: "ar_YE",
    url: "https://buyers.ye",
    siteName: "Buyers",
  },
};

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} className={`${inter.variable} ${cairo.variable}`}>
       <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
            <WhatsAppSupport />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
