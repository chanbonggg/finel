import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProduct as fetchProduct } from "@/lib/api/products";
import { getSiteUrl } from "@/lib/site-url";
import { SEO } from "@/constants/seo";
import { PARTNERS } from "@/constants/partners";

type PageProps = {
  params: Promise<{ id: string }>;
};

function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");
}

function getProductBrand(companyId: number) {
  const partner = PARTNERS.find((item) => item.id === companyId);
  if (!partner) return { name: "FineL", url: getSiteUrl() };

  const displayNames: Record<string, string> = {
    imi: "IMI Norgren",
    "sns pneumatic": "SNS Pneumatic",
    cypag: "CYPAG",
    parker: "Parker",
    kcc: "KCC",
  };

  return {
    name: displayNames[partner.name] ?? partner.name,
    url: partner.url,
  };
}

const getProduct = cache(async function getProduct(id: string) {
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return fetchProduct(productId);
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
  const brand = getProductBrand(product.companyId);
  const keywords = [
    ...SEO.baseKeywords,
    brand.name,
    product.name,
    product.spec,
    product.category,
  ];

  return {
    title: product.name,
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${product.name} | ${SEO.siteName}`,
      description,
      url: pageUrl,
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${SEO.siteName}`,
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
  const brand = getProductBrand(product.companyId);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl || undefined,
    category: product.category,
    url: `${siteUrl}/products/${product.id}`,
    brand: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
  };

  return (
    <div className="site-section pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <div className="site-container">
        <Link href="/products" className="mb-6 inline-flex text-sm font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">
          ← 제품 목록
        </Link>

        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] items-start gap-6 max-lg:grid-cols-1">
          <section className="surface-card-lg">
            <div className="relative min-h-[430px] bg-gradient-to-b from-white to-[var(--color-pale)] max-sm:min-h-[300px]">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="product-image-contain"
                  priority
                />
              ) : (
                <div className="grid h-[430px] place-items-center max-sm:h-[300px]">
                  <span className="placeholder-mark">{product.category.slice(0, 2)}</span>
                </div>
              )}
            </div>
          </section>

          <aside className="surface-card-lg">
            <div className="p-7">
              <p className="site-eyebrow">{product.category}</p>
              <h1 className="site-section-title">{product.name}</h1>
              <p className="site-copy mt-4 whitespace-pre-line">
                {product.description || "제품 도입을 위한 전문 상담과 견적 및 제휴 문의를 신청할 수 있습니다."}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                {[
                  ["브랜드", brand.name],
                  ["제품군", product.category],
                  ["스펙", product.spec],
                  ["문의 방식", "폼 · 전화 · 카카오"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)] p-4">
                    <span className="mb-1 block text-xs font-black text-[var(--color-muted)]">
                      {label}
                    </span>
                    <span className="line-clamp-2-safe text-sm font-black text-[var(--color-ink)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex gap-2.5 max-sm:flex-col">
                <Link
                  href={`/contact?product=${encodeURIComponent(product.name)}`}
                  className="button-primary flex-1"
                >
                  견적 및 제휴 문의
                </Link>
                <a href="tel:02-2693-3569" className="button-secondary flex-1">
                  전화 문의
                </a>
              </div>
            </div>
          </aside>
        </div>

        <section className="site-section">
          <h2 className="site-section-title mb-5">제품 상세 정보</h2>
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <tbody>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="w-44 bg-[var(--color-pale)] p-4 text-sm font-black text-[var(--color-body)]">제품명</th>
                  <td className="p-4 text-sm text-[var(--color-body)]">{product.name}</td>
                </tr>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="bg-[var(--color-pale)] p-4 text-sm font-black text-[var(--color-body)]">제품군</th>
                  <td className="p-4 text-sm text-[var(--color-body)]">{product.category}</td>
                </tr>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="bg-[var(--color-pale)] p-4 text-sm font-black text-[var(--color-body)]">스펙</th>
                  <td className="p-4 text-sm text-[var(--color-body)]">{product.spec}</td>
                </tr>
                <tr>
                  <th className="bg-[var(--color-pale)] p-4 text-sm font-black text-[var(--color-body)]">상담 안내</th>
                  <td className="p-4 text-sm leading-relaxed text-[var(--color-body)]">
                    제품 도입을 위한 전문 상담부터 견적 및 제휴 문의까지 담당자가 확인 후 신속하게 연락드립니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="pb-20">
          <div className="surface-card-lg grid grid-cols-[1fr_auto] items-center gap-5 p-6 max-sm:grid-cols-1">
            <div>
              <strong className="block text-xl font-black">제품 상담이 필요하신가요?</strong>
              <span className="site-muted mt-1 block">
                모델명, 수량, 사용 환경을 남겨주시면 담당자가 확인 후 연락드립니다.
              </span>
            </div>
            <Link
              href={`/contact?product=${encodeURIComponent(product.name)}`}
              className="button-primary"
            >
              이 제품 문의하기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
