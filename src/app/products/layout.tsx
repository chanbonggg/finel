import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제품",
  description: "finel의 산업용 공압 제품 라인업을 확인하세요.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
