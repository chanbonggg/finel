    import { PARTNERS } from "@/constants/partners";
import type { Metadata } from "next";
import Image from "next/image";
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

    return (
        <div className="site-section">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />

            <div className="site-container">
                <section className="surface-card-lg p-7 md:p-12">
                    <p className="site-eyebrow">About FineL</p>
                    <h1 className="site-title">산업용 공압 부품 전문 기업</h1>
                    <p className="site-copy mt-4 max-w-3xl">
                        신뢰할 수 있는 기술과 검증된 안정성을 바탕으로 제품 도입 상담부터
                        견적 및 제휴 문의까지 책임 있게 지원합니다.
                    </p>
                </section>

                <div className="mt-6 grid grid-cols-[0.9fr_1.1fr] gap-6 max-lg:grid-cols-1">
                    <section className="surface-card-lg p-6">
                        <h2 className="site-section-title leading-tight">주요 파트너사</h2>

                        <div className="mt-9 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                            {PARTNERS.map((partner) => (
                                <a
                                    key={partner.id}
                                    href={partner.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="grid min-h-[78px] place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)] p-4 transition hover:border-[var(--color-blue)]"
                                >
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        width={120}
                                        height={64}
                                        className="max-h-12 w-auto object-contain"
                                    />
                                </a>
                            ))}
                        </div>
                    </section>

                    <section className="surface-card-lg p-6">
                        <h2 className="site-section-title mb-5">오시는 길</h2>
                        <div className="h-72 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)]">
                            <iframe
                                width="100%"
                                height="100%"
                                title="map"
                                src="https://maps.google.com/maps?q=인천광역시 동구 방축로 37번길 30&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                loading="lazy"
                            ></iframe>
                        </div>
                        <div className="mt-5 grid gap-2 text-[var(--color-body)]">
                            <p className="break-keep"><strong>주소:</strong> 인천광역시 동구 방축로 37번길 30, 2동 206호</p>
                            <p><strong>전화:</strong> 02-2693-3569</p>
                            <p><strong>팩스:</strong> 032-232-8823</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
