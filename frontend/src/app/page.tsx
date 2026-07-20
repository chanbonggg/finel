import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import HomeHeroClient from "@/features/home/HomeHeroClient";
import { getFeaturedProducts } from "@/lib/api/products";
import { PARTNERS } from "@/constants/partners";
import { SEO } from "@/constants/seo";
import type { Product } from "@/lib/api/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SEO.siteNameKo} 산업용 공압 부품 | ${SEO.siteName}`,
  description: `${SEO.siteNameKo}(${SEO.siteName})은 산업용 공압 부품과 pneumatic parts 제품 도입을 돕는 전문 기업입니다. Parker, IMI Norgren, SNS Pneumatic, KCC 등 주요 브랜드 제품 상담과 견적 문의를 지원합니다.`,
  keywords: [...SEO.baseKeywords, "공압 부품 공급", "공압 제품 상담", "공압 견적", "전문 기업"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SEO.siteNameKo} 산업용 공압 부품 | ${SEO.siteName}`,
    description: `${SEO.siteNameKo}(${SEO.siteName})은 산업용 공압 부품과 pneumatic parts 제품 상담, 기술 지원, 견적 문의를 제공합니다.`,
    url: "/",
    type: "website",
    images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} 산업용 공압 부품` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO.siteNameKo} 산업용 공압 부품 | ${SEO.siteName}`,
    description: `${SEO.siteNameKo}(${SEO.siteName})은 산업용 공압 부품과 pneumatic parts 제품 상담, 기술 지원, 견적 문의를 제공합니다.`,
    images: ["/og-image.png"],
  },
};

function getRandomHeroProducts(products: Product[]) {
  const visibleProducts = products.filter((product) => product.isVisible);
  const shuffled = [...visibleProducts].sort(() => Math.random() - 0.5);
  const targetCount = shuffled.length >= 5 ? 5 : 4;

  return shuffled.slice(0, Math.min(shuffled.length, targetCount));
}

export default async function Home() {
  const products = await getFeaturedProducts(12);
  const heroProducts = getRandomHeroProducts(products);
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      <section className="border-b border-[var(--color-line)] bg-white">
        <div className="site-container grid min-h-[calc(100vh-58px)] grid-cols-[minmax(0,1fr)_minmax(360px,0.84fr)] items-center gap-11 py-14 max-lg:min-h-0 max-lg:grid-cols-1">
          <div className="min-w-0">
            <p className="site-eyebrow">산업용 공압 부품 전문 기업</p>
            <h1 className="site-title max-w-3xl">
              제품 도입 상담부터 견적 및 제휴 문의까지
            </h1>
            <p className="site-copy mt-5 max-w-2xl">
              공압 부품과 산업용 부품을 확인하고, 필요한 제품은 전문 상담을
              신청하세요. 담당자가 확인 후 신속하게 연락드립니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link className="button-primary" href="/contact">
                견적 및 제휴 문의
              </Link>
              <Link className="button-secondary" href="/products">
                제품 보기
              </Link>
              <a className="button-secondary" href="tel:02-2693-3569">
                전화 문의
              </a>
            </div>

          </div>

          <HomeHeroClient products={heroProducts} />
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="mb-6 flex items-end justify-between gap-5 max-sm:flex-col max-sm:items-start">
            <div>
              <p className="site-eyebrow">Featured products</p>
              <h2 className="site-section-title">주력 제품 안내</h2>
              <p className="site-muted mt-2">
                최고의 기술력이 담긴 최신 제품을 만나보세요.
              </p>
            </div>
            <Link className="button-secondary" href="/products">
              전체보기
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="surface-card p-8 text-center text-[var(--color-muted)]">
              등록된 주력 제품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="surface-card group flex min-w-0 flex-col"
                >
                  <div className="product-image-panel relative h-[190px] min-h-0">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="product-image-contain"
                      />
                    ) : (
                      <span className="placeholder-mark">
                        {product.category.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex grow flex-col p-5">
                    <span className="mb-2 text-xs font-black text-[var(--color-blue-dark)]">
                      {product.category} · {product.spec}
                    </span>
                    <h3 className="line-clamp-2-safe text-xl font-black text-[var(--color-ink)] group-hover:text-[var(--color-blue)]">
                      {product.name}
                    </h3>
                    <p className="line-clamp-2-safe mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                      {product.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="site-section bg-[var(--color-black)] text-white">
        <div className="site-container grid grid-cols-[0.85fr_1.15fr] items-center gap-11 max-lg:grid-cols-1">
          <div>
            <p className="mb-3 text-[15px] font-black text-[#8fc4ff]">Partners</p>
            <h2 className="text-4xl font-black leading-tight">
              공압 전문 제품을 상담합니다
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-white/70">
              파카(Parker), 노그린(IMI), 공압전문메이커(SNS Pneumatic),
              케이시시공압(KCC) 등 주요 브랜드 제품 상담을 제공합니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {PARTNERS.map((partner) => (
              <a
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid min-h-[82px] place-items-center rounded-xl border border-white/15 bg-white p-4 transition hover:border-[#8fc4ff]"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={132}
                  height={42}
                  unoptimized
                  className="max-h-10 w-auto object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
