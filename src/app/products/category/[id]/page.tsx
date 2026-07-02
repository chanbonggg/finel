import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCategory as fetchCategory } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import { SEO } from "@/constants/seo";
import ProductCard from "@/components/ProductCard";

type PageProps = {
    params: Promise<{ id: string }>;
};

const getCategory = cache(async function getCategory(id: string) {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
    }

    const category = await fetchCategory(categoryId);
    if (!category) return null;
    return { ...category, products: await getProducts({ categoryId }) };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const category = await getCategory(id);

    if (!category) {
        return {
            title: "카테고리를 찾을 수 없습니다",
            description: "요청하신 카테고리 정보를 찾을 수 없습니다.",
        };
    }

    const productNames = category.products.map((p) => p.name);
    const description = `${SEO.siteName}(${SEO.siteNameKo}) ${category.name} 제품 라인업. ${productNames.slice(0, 5).join(", ")}`.slice(0, 160);
    const keywords = [...SEO.baseKeywords, category.name, ...productNames.slice(0, 10)];
    const pageUrl = `/products/category/${category.id}`;

    return {
        title: `${category.name} 제품 | ${SEO.siteName}`,
        description,
        keywords,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: `${category.name} 제품 | ${SEO.siteName}`,
            description,
            url: pageUrl,
            type: "website",
        },
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { id } = await params;
    const category = await getCategory(id);

    if (!category) {
        notFound();
    }

    return (
        <div className="site-section">
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
