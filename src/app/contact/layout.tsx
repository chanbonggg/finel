import type { Metadata } from "next";
import { SEO } from "@/constants/seo";

export const metadata: Metadata = {
  title: "문의하기",
  description: `${SEO.siteNameKo}(${SEO.siteName}) 산업용 공압 부품 제품 상담, 견적, 도입 문의를 남길 수 있는 페이지입니다.`,
  keywords: [...SEO.baseKeywords, "문의", "상담", "공압 부품 견적", "제품 도입 문의"],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `공압 부품 문의 | ${SEO.siteName}`,
    description: `${SEO.siteNameKo} 산업용 공압 부품 제품 상담, 견적, 도입 문의`,
    url: "/contact",
    type: "website",
    images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} 문의하기` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `공압 부품 문의 | ${SEO.siteName}`,
    description: `${SEO.siteNameKo} 산업용 공압 부품 제품 상담, 견적, 도입 문의`,
    images: ["/og-image.png"],
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
