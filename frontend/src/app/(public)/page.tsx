import Link from "next/link";
import type { Metadata } from "next";
import { getFeaturedProducts, getProducts } from "@/lib/api/products";
import { SEO } from "@/constants/seo";

// Product data is available only after the Compose network starts. The fetches
// below remain Data Cache-backed, but must not run while the image is built.
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

import FineIcon from '@/components/FineIcon';
import ProductPhoto from '@/components/ProductPhoto';
import PartnerLogos from '@/components/PartnerLogos';
import ProductSearch from '@/features/products/components/ProductSearch';

export default async function Home() {
  const [featured, catalog] = await Promise.allSettled([getFeaturedProducts(3), getProducts()]);
  const products = featured.status === 'fulfilled' ? featured.value.filter(p => p.isVisible) : [];
  const categories = new Map<number, { name: string; count: number }>();
  if (catalog.status === 'fulfilled') for (const p of catalog.value) if (p.isVisible) {
    categories.set(p.categoryId, { name: p.category, count: (categories.get(p.categoryId)?.count ?? 0) + 1 });
  }

  return <>
    <section className="bg-[var(--color-paper)] py-10 sm:py-12">
      <div className="site-container">
        <p className="mb-4 text-xs font-bold tracking-wide text-[var(--color-blue)]">FINEL / PNEUMATIC PARTS</p>
        <h1 className="fine-title">필요한 공압 부품, 검색부터 문의까지.</h1>
        <div className="mt-3 flex flex-wrap justify-between gap-2"><p className="site-muted">제품명으로 찾거나 제품군을 선택한 뒤, 등록 규격을 비교해보세요.</p></div>
        <div className="mb-3 mt-8 flex justify-between gap-2"><h2 className="font-bold">주요 제품군</h2><Link href="/products" className="fine-link text-sm">전체 제품 보기 →</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...categories].slice(0,5).map(([id, group]) => <Link key={id} href={`/products/category/${id}`} className="fine-panel flex items-center justify-between gap-3 p-4 hover:border-[var(--color-blue)]"><span className="min-w-0 break-words"><strong>{group.name}</strong><span className="site-muted block">{group.count}개</span></span><span aria-hidden>↗</span></Link>)}
        </div>
        {!categories.size && <p className="site-muted">{catalog.status === 'rejected' ? '제품군을 불러오지 못했습니다.' : '등록된 제품군이 없습니다.'}</p>}
      </div>
    </section>
    <section className="site-container py-12">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">등록 제품 살펴보기</h2><p className="site-muted mt-2">필요한 제품의 상세로 이동하세요.</p></div><Link className="button-secondary gap-2" href="/products">제품 목록 · 비교 <FineIcon name="ArrowRightDark" /></Link></div>
      {products.length ? <div className="grid gap-5 sm:grid-cols-3">
        {products.map(p => <Link href={`/products/${p.id}`} key={p.id} className="fine-panel overflow-hidden hover:border-[var(--color-blue)]">
          <ProductPhoto url={p.imageUrl} name={p.name} icon="ImageLarge" sizes="(min-width: 640px) 33vw, 100vw" className="h-36 rounded-none" />
          <div className="p-5"><h3 className="break-words text-xl font-bold">{p.name}</h3><p className="site-muted my-2">{p.category}</p><p className="flex flex-wrap justify-between gap-2 text-sm"><span>{p.spec || '규격 미등록'}</span><span className="fine-link">상세 보기 →</span></p></div>
        </Link>)}
      </div> : <p className="fine-panel p-8 text-center">{featured.status === 'rejected' ? '제품을 불러오지 못했습니다.' : '등록된 제품이 없습니다.'}</p>}
    </section>
    <section className="border-t border-[var(--color-line)]">
      <div className="site-container grid gap-6 py-7 md:grid-cols-[2fr_1fr]">
        <div><h2 className="site-muted mb-4 font-bold">주요 파트너사</h2><PartnerLogos /></div>
        <div className="grid content-center gap-1 md:border-l md:border-[var(--color-line)] md:pl-7"><p className="site-muted">제품 선택이 어려우신가요?</p><a className="text-2xl font-bold" href="tel:02-2693-3569">02-2693-3569</a><Link className="fine-link text-sm" href="/contact">문의하기 →</Link></div>
      </div>
    </section>
  </>;
}
