import type { Metadata } from "next";
import { SEO } from "@/constants/seo";

export const metadata: Metadata = {
  title: "제품",
  description:
    `${SEO.siteName}(${SEO.siteNameKo})의 산업용 공압 부품 제품 라인업을 확인하세요. 솔레노이드 밸브, 공압 실린더, 레귤레이터 등 다양한 공압 제품을 제공합니다.`,
  keywords: [...SEO.baseKeywords, "제품", "솔레노이드 밸브", "공압 실린더"],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: `제품 라인업 | ${SEO.siteName}`,
    description:
      `${SEO.siteName}(${SEO.siteNameKo})의 산업용 공압 부품 제품 라인업을 확인하세요.`,
    url: "/products",
    type: "website",
  },
};

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
