import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "JurisAI — Inteligencia Legal para México",
    template: "%s | JurisAI",
  },
  description:
    "Investigación jurídica, redacción de documentos y cumplimiento regulatorio — impulsados por IA, diseñados para el derecho mexicano.",
  keywords: ["abogados", "IA legal", "derecho mexicano", "investigación jurídica", "México"],
  metadataBase: new URL("https://jurisai.com.mx"),
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://jurisai.com.mx",
    siteName: "JurisAI",
    title: "JurisAI — Inteligencia Legal para México",
    description:
      "Tu copiloto legal con inteligencia artificial para el derecho mexicano.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JurisAI — Inteligencia Legal para México",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisAI — Inteligencia Legal para México",
    description: "Tu copiloto legal con inteligencia artificial para el derecho mexicano.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSerifDisplay.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
