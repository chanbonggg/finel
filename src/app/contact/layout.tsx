import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의하기",
  description: "finel 제품 상담 및 도입 문의 페이지입니다.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
