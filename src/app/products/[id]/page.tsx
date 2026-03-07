import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

type PageProps = {
  params: Promise<{ id: string }>;
};

function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");
}

const getProduct = cache(async function getProduct(id: string) {
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      spec: true,
      description: true,
      imageUrl: true,
      isVisible: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isVisible) {
    return {
      title: "제품을 찾을 수 없습니다",
      description: "요청하신 제품 정보를 찾을 수 없습니다.",
    };
  }

  const description = `${product.name} - ${product.spec}. ${product.description}`.slice(0, 160);
  const pageUrl = `/products/${product.id}`;
  const keywords = [
    product.name,
    product.spec,
    product.category.name,
    "공압 부품",
    "산업용 부품",
    "finel",
  ];

  return {
    title: product.name,
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${product.name} | finel`,
      description,
      url: pageUrl,
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | finel`,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isVisible) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl || undefined,
    category: product.category.name,
    url: `${siteUrl}/products/${product.id}`,
    brand: {
      "@type": "Organization",
      name: "finel",
      url: siteUrl,
    },
  };

  return (
    <div className="py-10 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">
          ← 제품 목록
        </Link>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 font-bold text-xl py-20">No Image</span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="text-blue-600 text-sm font-bold uppercase tracking-wide mb-3">
              Spec: {product.spec}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{product.name}</h1>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-10">{product.description}</p>
            <Link
              href={`/contact?product=${encodeURIComponent(product.name)}`}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-md"
            >
              이 제품 문의하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
