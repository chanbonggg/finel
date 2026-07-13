import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCategory as fetchCategory } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import { SEO } from "@/constants/seo";
import { getSiteUrl } from "@/lib/site-url";
import ProductCard from "@/components/ProductCard";

type PageProps = {
    params: Promise<{ id: string }>;
};

export const revalidate = 300;

const getCategory = cache(async function getCategory(id: string) {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
    }

    const category = await fetchCategory(categoryId);
    if (!category) return null;
    return { ...category, products: await getProducts({ categoryId }) };
});

function safeJsonLd(obj: Record<string, unknown>): string {
    return JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function truncateMeta(value: string, length = 158): string {
    return value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const category = await getCategory(id);

    if (!category) {
        return {
            title: "카테고리를 찾을 수 없습니다",
            description: "요청하신 카테고리 정보를 찾을 수 없습니다.",
        };
    }

    const visibleProducts = category.products.filter((product) => product.isVisible);
    const productNames = visibleProducts.map((p) => p.name);
    const productSpecs = visibleProducts.map((p) => p.spec);
    const description = truncateMeta(
        `${SEO.siteNameKo}(${SEO.siteName}) ${category.name} 제품 라인업입니다. ${productNames.slice(0, 5).join(", ") || "산업용 공압 부품"} 등 공압 제품 상담과 견적 문의를 지원합니다.`
    );
    const keywords = uniqueStrings([
        ...SEO.baseKeywords,
        category.name,
        `${category.name} 제품`,
        `${category.name} 공압 부품`,
        ...productNames.slice(0, 10),
        ...productSpecs.slice(0, 10),
    ]);
    const pageUrl = `/products/category/${category.id}`;

    return {
        title: `${category.name} 공압 부품`,
        description,
        keywords,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: `${category.name} 공압 부품 | ${SEO.siteName}`,
            description,
            url: pageUrl,
            type: "website",
            images: [{ url: "/og-image.png", alt: `${SEO.siteNameKo} ${category.name} 제품` }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${category.name} 공압 부품 | ${SEO.siteName}`,
            description,
            images: ["/og-image.png"],
        },
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { id } = await params;
    const category = await getCategory(id);

    if (!category) {
        notFound();
    }

    const siteUrl = getSiteUrl();
    const visibleProducts = category.products.filter((product) => product.isVisible);
    const pageUrl = `${siteUrl}/products/category/${category.id}`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                name: `${category.name} 공압 부품`,
                description: `${SEO.siteNameKo}의 ${category.name} 제품 라인업입니다.`,
                url: pageUrl,
                inLanguage: "ko-KR",
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    {
                        "@type": "ListItem",
                        position: 1,
                        name: "홈",
                        item: siteUrl,
                    },
                    {
                        "@type": "ListItem",
                        position: 2,
                        name: "제품",
                        item: `${siteUrl}/products`,
                    },
                    {
                        "@type": "ListItem",
                        position: 3,
                        name: category.name,
                        item: pageUrl,
                    },
                ],
            },
            {
                "@type": "ItemList",
                name: `${category.name} 제품 목록`,
                itemListElement: visibleProducts.slice(0, 20).map((product, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    url: `${siteUrl}/products/${product.id}`,
                    name: product.name,
                })),
            },
        ],
    };

    return (
        <div className="site-section">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />
            <div className="site-container">
            <section className="mb-8">
                <Link
                    href="/products"
                    className="mb-6 inline-flex text-sm font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                    ← 전체 제품 보기
                </Link>
                <p className="site-eyebrow">Category</p>
                <h1 className="site-title">{category.name}</h1>
                <p className="site-copy mt-4">
                    {SEO.siteNameKo}의 {category.name} 제품 라인업입니다.
                </p>
            </section>

            <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                {category.products.length === 0 && (
                    <div className="surface-card col-span-full p-8 text-center text-[var(--color-muted)]">
                        등록된 제품이 없습니다.
                    </div>
                )}

                {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} categoryLabel={category.name} />
                ))}
            </section>
            </div>
        </div>
    );
}
