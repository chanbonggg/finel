import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Finel", // 기본 사이트 제목
    template: "%s | Finel", // 각 페이지 제목 형식 (예: "제품 소개 | Finel")
  },
  description: "Finel은 고객의 비즈니스 성장을 돕는 최고의 파트너입니다.",
  openGraph: {
    title: "Finel - 혁신적인 솔루션",
    description: "Finel과 함께 비즈니스의 미래를 만들어가세요.",
    // TODO: 웹사이트를 대표하는 이미지 주소를 넣어주세요. (예: https://www.finel.com/og-image.png)
    images: ["/og-image.png"], 
    locale: "ko_KR",
    type: "website",
  },
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