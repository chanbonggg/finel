import type { Metadata } from "next";
import { SEO } from "@/constants/seo";

export const metadata: Metadata = {
  title: "공압 부품 제품 목록",
  description:
    `${SEO.siteNameKo}(${SEO.siteName})의 산업용 공압 부품 제품 라인업을 확인하세요. 솔레노이드 밸브, 공압 실린더, 레귤레이터, pneumatic parts 등 다양한 공압 제품 상담을 제공합니다.`,
  keywords: [...SEO.baseKeywords, "제품", "제품 목록", "솔레노이드 밸브", "공압 실린더", "레귤레이터"],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: `공압 부품 제품 목록 | ${SEO.siteName}`,
    description:
      `${SEO.siteNameKo}(${SEO.siteName})의 산업용 공압 부품 제품 라인업과 상담 정보를 확인하세요.`,
    url: "/products",
    type: "website",
    images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} 공압 부품 제품 목록` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `공압 부품 제품 목록 | ${SEO.siteName}`,
    description:
      `${SEO.siteNameKo}(${SEO.siteName})의 산업용 공압 부품 제품 라인업과 상담 정보를 확인하세요.`,
    images: ["/og-image.png"],
  },
};

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
