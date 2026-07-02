import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import QuickMenu from "@/components/QuickMenu";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import { SEO } from "@/constants/seo";
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
    default: SEO.siteName,
    template: `%s | ${SEO.siteName}`,
  },
  description: `${SEO.companyName} ${SEO.siteName}`,
  keywords: SEO.baseKeywords,
  openGraph: {
    title: SEO.siteName,
    description: `${SEO.companyName} ${SEO.siteName}`,
    url: siteUrl,
    siteName: SEO.siteName,
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
        <div className="site-shell">
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <QuickMenu />
          <Footer />
        </div>
      </body>
    </html>
  );
}
