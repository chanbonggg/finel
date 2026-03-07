import type { Metadata } from "next";
import { SEO } from "@/constants/seo";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SEO.siteName}(${SEO.siteNameKo}) 개인정보처리방침 안내 페이지입니다.`,
  keywords: [...SEO.baseKeywords, "개인정보"],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: `개인정보처리방침 | ${SEO.siteName}`,
    description: `${SEO.siteName}(${SEO.siteNameKo}) 개인정보처리방침`,
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
