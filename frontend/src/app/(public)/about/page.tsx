    import { PARTNERS } from "@/constants/partners";
import type { Metadata } from "next";
import Link from "next/link";
import PartnerLogos from "@/components/PartnerLogos";
import { getSiteUrl } from "@/lib/site-url";
import { SEO } from "@/constants/seo";

const partnerNames = PARTNERS.map((partner) => partner.name);

export const metadata: Metadata = {
    title: "회사 소개",
    description: `${SEO.siteNameKo}(${SEO.siteName})의 산업용 공압 부품 상담 분야, 주요 파트너 브랜드, 사업장 위치와 연락처를 확인할 수 있습니다.`,
    keywords: [...SEO.baseKeywords, "회사 소개", "공압 부품 회사", "공압 전문 기업", ...partnerNames],
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: `${SEO.siteNameKo} 회사 소개 | ${SEO.siteName}`,
        description: `${SEO.siteNameKo}의 산업용 공압 부품 상담 분야와 주요 파트너 브랜드를 확인하세요.`,
        url: "/about",
        type: "website",
        images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} 회사 소개` }],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SEO.siteNameKo} 회사 소개 | ${SEO.siteName}`,
        description: `${SEO.siteNameKo}의 산업용 공압 부품 상담 분야와 주요 파트너 브랜드를 확인하세요.`,
        images: ["/og-image.png"],
    },
};

export default function AboutPage() {
    const siteUrl = getSiteUrl();

    // LocalBusiness JSON-LD
    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "finel",
        description: "산업용 공압 부품 전문 기업",
        url: siteUrl,
        telephone: "02-2693-3569",
        faxNumber: "032-232-8823",
        address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
            addressLocality: "인천광역시 동구",
            postalCode: "22028",
            streetAddress: "방축로 37번길 30, 2동 206호",
        },
        image: `${siteUrl}/og-image.png`,
    };

    return <div className="site-container py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <section><p className="fine-link mb-5 text-sm">About FineL</p><h1 className="fine-title">산업용 공압 부품 전문 기업</h1>
        <p className="site-muted mt-4">신뢰할 수 있는 기술과 검증된 안정성을 바탕으로 제품 도입 상담부터 견적 및 제휴 문의까지 지원합니다.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link className="button-secondary" href="/products">제품 목록 보기 →</Link><Link className="button-primary" href="/contact">문의하기</Link></div>
      </section>
      <section className="mt-12"><h2 className="mb-5 text-2xl font-bold">주요 파트너사</h2><PartnerLogos boxed /></section>
      <section id="directions" className="mt-12"><h2 className="mb-5 text-2xl font-bold">오시는 길</h2>
        <div className="h-64 overflow-hidden rounded border border-[var(--color-line)] bg-[var(--color-pale)]"><iframe
                                width="100%"
                                height="100%"
                                title="FineL 사업장 지도"
                                src="https://maps.google.com/maps?q=인천광역시 동구 방축로 37번길 30&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                loading="lazy"
                            ></iframe></div>
        <div className="site-muted mt-5 grid gap-2"><p>주소: 인천광역시 동구 방축로 37번길 30, 2동 206호</p><a href="tel:02-2693-3569">전화: 02-2693-3569</a><p>팩스: 032-232-8823</p></div>
      </section>
    </div>;
}
