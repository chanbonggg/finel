import type { Metadata } from "next";
import { SEO } from "@/constants/seo";

export const metadata: Metadata = {
  title: "문의하기",
  description: `${SEO.siteName}(${SEO.siteNameKo}) 제품 상담 및 도입 문의 페이지입니다.`,
  keywords: [...SEO.baseKeywords, "문의", "상담"],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `문의하기 | ${SEO.siteName}`,
    description: `${SEO.siteName}(${SEO.siteNameKo}) 제품 상담 및 도입 문의`,
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
