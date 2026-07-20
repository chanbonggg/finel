import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
  description: `${SEO.siteNameKo}(${SEO.siteName})은 산업용 공압 부품, pneumatic parts, 공압 제품 도입 상담과 견적 문의를 지원하는 전문 기업입니다.`,
  keywords: SEO.baseKeywords,
  openGraph: {
    title: `${SEO.siteNameKo}(${SEO.siteName}) | ${SEO.companyName}`,
    description: `${SEO.siteNameKo}은 산업용 공압 부품과 pneumatic parts 제품 상담, 기술 지원, 견적 문의를 제공합니다.`,
    url: siteUrl,
    siteName: SEO.siteName,
    images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} ${SEO.companyName}` }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO.siteNameKo}(${SEO.siteName}) | ${SEO.companyName}`,
    description: `${SEO.siteNameKo}은 산업용 공압 부품과 pneumatic parts 제품 상담, 기술 지원, 견적 문의를 제공합니다.`,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SEO.siteName,
      alternateName: [SEO.siteNameKo, "finel"],
      description: SEO.companyName,
      url: siteUrl,
      logo: `${siteUrl}/og-image.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+82-2-2693-3569",
        contactType: "sales",
        areaServed: "KR",
        availableLanguage: ["ko"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SEO.siteName,
      alternateName: SEO.siteNameKo,
      url: siteUrl,
      inLanguage: "ko-KR",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <div className="site-shell">
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
