import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SEO } from "@/constants/seo";

type PageProps = {
    params: Promise<{ id: string }>;
};

const getCategory = cache(async function getCategory(id: string) {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
    }

    return prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            products: {
                where: { isVisible: true },
                orderBy: { id: "desc" },
            },
        },
    });
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
        <div className="py-10">
            {/* 헤더 섹션 */}
            <section className="text-center mb-12 px-4">
                <Link
                    href="/products"
                    className="inline-block text-sm text-gray-500 hover:text-gray-900 mb-6"
                >
                    ← 전체 제품 보기
                </Link>
                <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
                <p className="text-gray-600">
                    {SEO.siteNameKo}의 {category.name} 제품 라인업입니다.
                </p>
            </section>

            {/* 제품 리스트 그리드 */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {category.products.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl">
                        등록된 제품이 없습니다.
                    </div>
                )}

                {category.products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 bg-white group flex flex-col"
                    >
                        {/* 이미지 영역 */}
                        <div className="h-60 bg-blue-50 flex items-center justify-center relative overflow-hidden">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                />
                            ) : (
                                <span className="text-gray-400 font-bold text-xl group-hover:scale-110 transition duration-500">
                                    No Image
                                </span>
                            )}

                            {/* 카테고리 뱃지 */}
                            <span className="absolute top-4 left-4 bg-white/90 text-xs font-bold px-3 py-1 rounded-full shadow-sm text-gray-700">
                                {category.name}
                            </span>
                        </div>

                        {/* 제품 정보 영역 */}
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="text-blue-600 text-sm font-bold mb-2 uppercase tracking-wide">
                                Spec: {product.spec}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                {product.name}
                            </h2>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
