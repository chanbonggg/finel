'use client'; // 1. 데이터를 가져오려면(fetch) 클라이언트 컴포넌트여야 합니다.

import { useState, useEffect, useMemo } from 'react'; // React 기능 가져오기
import Image from "next/image";
import { PARTNERS } from '@/constants/partners';
import { getProducts, type Product } from '@/lib/api/products';
import type { Category } from '@/lib/api/types';
import ProductCard from '@/features/products/components/ProductCard';

export default function ProductsPage() {
    // 2. [변경된 부분] 가짜 데이터 대신 '빈 통(State)'을 만듭니다.
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const ITEMS_PER_PAGE = 9;

    // 3. [변경된 부분] 페이지가 열리면 서버에서 데이터를 가져옵니다.
    useEffect(() => {
        async function fetchProductsAndCategories() {
            try {
                setLoadError(false);
                const productList = await getProducts();
                setProducts(productList);
                setCategories(Array.from(new Map(productList.map(product => [product.categoryId, {
                    id: product.categoryId, name: product.category, companyId: product.companyId,
                }])).values()));
            } catch (error) {
                console.error("제품 불러오기 실패:", error);
                setLoadError(true);
            } finally {
                setLoading(false); // 로딩 끝
            }
        }

        fetchProductsAndCategories();
    }, []);

    // 카테고리 변경 시 1페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedCompanyId]);

    // 회사 선택 핸들러
    const handleCompanyClick = (id: number | 'all') => {
        setSelectedCompanyId(id);
        setSelectedCategory('all');
        setCurrentPage(1);
    };

    const categoryOptions = useMemo(() => {
        // 선택된 회사의 카테고리만 필터링
        let filteredCats = categories;
        if (selectedCompanyId !== 'all') {
            filteredCats = categories.filter(c => c.companyId === selectedCompanyId);
        }

        return filteredCats;
    }, [categories, selectedCompanyId]);

    const filteredProducts = useMemo(() => {
        // 1. 회사 필터링
        let result = products.filter(p => p.isVisible);

        if (selectedCompanyId !== 'all') {
            result = result.filter(p => p.companyId === selectedCompanyId);
        }

        // 2. 카테고리 필터링
        if (selectedCategory !== 'all') {
            result = result.filter((product) => product.category === selectedCategory);
        }

        // 3. 최신순 정렬
        result = result.sort((a, b) => b.id - a.id);

        return result;
    }, [products, selectedCompanyId, selectedCategory]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const displayedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const categoryLinkClass = (categoryName: string) =>
        selectedCategory === categoryName
            ? "appearance-none rounded-full border border-[var(--color-black)] bg-[var(--color-black)] px-4 py-2 font-sans text-sm font-black leading-normal text-white"
            : "appearance-none rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-sans text-sm font-black leading-normal text-[var(--color-body)] transition hover:border-[var(--color-blue)]";

    const handleCategoryClick = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setCurrentPage(1);
    };

    // 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="site-container site-section text-center text-[var(--color-muted)]">제품 목록을 불러오는 중...</div>;
    }

    if (loadError) {
        return (
            <div className="site-container site-section text-center">
                <p className="text-[var(--color-body)]">제품 목록을 불러오지 못했습니다.</p>
                <button type="button" onClick={() => window.location.reload()} className="button-secondary mt-4">
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="site-section">
            <div className="site-container">
                <section className="mb-8">
                    <p className="site-eyebrow">Products</p>
                    <h1 className="site-title">공압 부품 제품 목록</h1>
                    <p className="site-copy mt-4 max-w-3xl">
                        브랜드, 제품군, 모델명 기준으로 필요한 제품을 확인하고 상세 페이지에서
                        스펙과 상담 정보를 이어볼 수 있습니다.
                    </p>
                </section>

                <section className="mb-7 grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
                    {PARTNERS.map((partner) => (
                        <button
                            key={partner.id}
                            onClick={() => handleCompanyClick(partner.id)}
                            className={`grid min-h-20 place-items-center rounded-xl border bg-white p-2 transition ${selectedCompanyId === partner.id
                                ? 'border-[var(--color-blue)] bg-[#f7fbff]'
                                : 'border-[var(--color-line)] hover:border-[var(--color-blue)]'
                                }`}
                            title={partner.name}
                        >
                            <Image
                                src={partner.logo}
                                alt={partner.name}
                                width={150}
                                height={54}
                                unoptimized
                                className="max-h-12 w-[82%] object-contain"
                            />
                        </button>
                    ))}
                </section>

                {selectedCompanyId !== 'all' && (
                    <section className="mb-8 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => handleCategoryClick('all')}
                            className={categoryLinkClass('all')}
                        >
                            All
                        </button>
                        {categoryOptions.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => handleCategoryClick(category.name)}
                                className={categoryLinkClass(category.name)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </section>
                )}

                <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    {displayedProducts.length === 0 && (
                        <div className="surface-card col-span-full p-8 text-center text-[var(--color-muted)]">
                            등록된 제품이 아직 없습니다. 관리자 페이지에서 추가해주세요.
                        </div>
                    )}

                    {displayedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </section>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="button-secondary min-h-10 px-3 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`h-10 w-10 rounded-lg text-sm font-black transition ${currentPage === page
                                    ? 'bg-[var(--color-black)] text-white'
                                    : 'border border-[var(--color-line)] bg-white text-[var(--color-body)] hover:bg-[var(--color-pale)]'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="button-secondary min-h-10 px-3 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
