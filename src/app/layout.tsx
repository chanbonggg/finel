import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import QuickMenu from "@/components/QuickMenu";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    ...(process.env.NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  },
  title: {
    default: "finel",
    template: "%s | finel",
  },
  description: "산업용 공압 부품 전문 기업 finel",
  openGraph: {
    title: "finel",
    description: "산업용 공압 부품 전문 기업 finel",
    url: siteUrl,
    siteName: "finel",
    images: ["/og-image.png"],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "finel",
  url: siteUrl,
  logo: `${siteUrl}/og-image.png`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Navbar />
        <main className="min-h-screen container mx-auto p-4">{children}</main>
        <QuickMenu />
        <Footer />
      </body>
    </html>
  );
}
