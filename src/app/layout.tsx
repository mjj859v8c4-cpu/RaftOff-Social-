import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { FloatingCallButton } from "@/components/layout/floating-call-button";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { Navbar } from "@/components/layout/navbar";
import { LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { BUSINESS, SITE } from "@/lib/constants";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${BUSINESS.name} | Mobile Mechanic in Rochester, MI`,
    template: `%s | ${BUSINESS.name}`,
  },
  description:
    "Rochester Mobile Auto Repair brings expert automotive service to your driveway in Rochester, Rochester Hills, and surrounding Oakland and Macomb County communities. Call (248) 928-4118.",
  applicationName: BUSINESS.name,
  keywords: [
    "mobile mechanic Rochester MI",
    "Rochester mobile auto repair",
    "mobile oil change Rochester Hills",
    "brake repair near me Rochester",
    "mobile battery replacement Auburn Hills",
    "auto repair Troy MI mobile",
    "Oakland County mobile mechanic",
    "Macomb County mobile auto repair",
  ],
  authors: [{ name: BUSINESS.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: BUSINESS.name,
    title: `${BUSINESS.name} | Quality Repairs. At Your Location.`,
    description:
      "Skip the repair shop. Expert mobile auto repair serving Rochester, Rochester Hills, and nearby communities.",
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: `${BUSINESS.name} — mobile auto repair`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BUSINESS.name} | Mobile Mechanic Rochester MI`,
    description:
      "Convenient, reliable automotive service at your home, office, or driveway.",
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--black)] text-white">
        <LocalBusinessJsonLd />
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <FloatingCallButton />
        <MobileActionBar />
      </body>
    </html>
  );
}
