import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // 1. 우리가 만든 메뉴바 가져오기
import QuickMenu from "@/components/QuickMenu";// 퀵메뉴 가져오기
import Footer from "@/components/Footer";//Footer가져오기
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 사이트 전체에 적용될 기본 메타데이터입니다.
 * https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-object
 */
export const metadata: Metadata = {
  // robots.txt, sitemap.xml 등에서 사용할 기본 URL을 설정합니다.
  metadataBase: new URL("https://www.finel.co.kr"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  title: {
    default: "finel - 산업용 공압 부품 전문몰", // 기본 제목
    template: "%s | finel", // 페이지별 제목 템플릿
  },
  description:
    "공압 실린더, 밸브, 피팅 등 고품질 산업용 공압 부품을 합리적인 가격에 만나보세요. 전문가의 빠른 상담과 기술 지원을 약속합니다.",
  openGraph: {
    title: "finel: 산업 자동화를 위한 최적의 공압 솔루션", // OG용 제목
    description:
      "고품질 공압 부품, 합리적인 가격, 그리고 전문가의 기술 지원까지. finel에서 비즈니스의 성공을 앞당기세요.", // OG용 설명
    url: "https://www.finel.co.kr",
    siteName: "finel",
    // TODO: 웹사이트를 대표하는 이미지 주소를 넣어주세요. (예: https://www.finel.com/og-image.png)
    images: ["/og-image.png"], // /public/og-image.png
    locale: "ko_KR",
    type: "website",
  },
};

/**
 * 모바일 기기 등 다양한 화면 크기에서 사이트가 어떻게 보일지 제어합니다.
 * https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 사용자의 확대/축소 기능을 비활성화합니다.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 3. 메뉴바 장착 (모든 페이지 상단 고정) */}
        <Navbar />

        {/* 4. 실제 페이지 내용이 들어가는 곳 */}
        <main className="min-h-screen container mx-auto p-4">
          {children}
        </main>
        {/* 2. 우측 하단 퀵메뉴 (항상 떠있음) */}
        <QuickMenu />
        <Footer />
      </body>
    </html>
  );
}
