'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PARTNERS } from '@/constants/partners';
import type { Product } from '@/lib/api/products';
import type { Category } from '@/lib/api/types';
import ProductCard from '@/features/products/components/ProductCard';

const ITEMS_PER_PAGE = 9;

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const categories = useMemo<Category[]>(() => Array.from(new Map(initialProducts.map((product) => [product.categoryId, {
        id: product.categoryId,
        name: product.category,
        companyId: product.companyId,
    }])).values()), [initialProducts]);

    const categoryOptions = useMemo(() => selectedCompanyId === 'all'
        ? categories
        : categories.filter((category) => category.companyId === selectedCompanyId), [categories, selectedCompanyId]);

    const filteredProducts = useMemo(() => initialProducts
        .filter((product) => product.isVisible)
        .filter((product) => selectedCompanyId === 'all' || product.companyId === selectedCompanyId)
        .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
        .sort((a, b) => b.id - a.id), [initialProducts, selectedCategory, selectedCompanyId]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const displayedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const categoryLinkClass = (categoryName: string) => selectedCategory === categoryName
        ? 'appearance-none rounded-full border border-[var(--color-black)] bg-[var(--color-black)] px-4 py-2 font-sans text-sm font-black leading-normal text-white'
        : 'appearance-none rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-sans text-sm font-black leading-normal text-[var(--color-body)] transition hover:border-[var(--color-blue)]';

    const handleCompanyClick = (id: number) => {
        setSelectedCompanyId(id);
        setSelectedCategory('all');
        setCurrentPage(1);
    };

    return (
        <div className="site-section">
            <div className="site-container">
                <section className="mb-8">
                    <p className="site-eyebrow">Products</p>
                    <h1 className="site-title">공압 부품 제품 목록</h1>
                    <p className="site-copy mt-4 max-w-3xl">브랜드, 제품군, 모델명 기준으로 필요한 제품을 확인하고 상세 페이지에서 스펙과 상담 정보를 이어볼 수 있습니다.</p>
                </section>

                <section className="mb-7 grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
                    {PARTNERS.map((partner) => (
                        <button key={partner.id} type="button" onClick={() => handleCompanyClick(partner.id)} className={`grid min-h-20 place-items-center rounded-xl border bg-white p-2 transition ${selectedCompanyId === partner.id ? 'border-[var(--color-blue)] bg-[#f7fbff]' : 'border-[var(--color-line)] hover:border-[var(--color-blue)]'}`} title={partner.name}>
                            <Image src={partner.logo} alt={partner.name} width={150} height={54} unoptimized className="max-h-12 w-[82%] object-contain" />
                        </button>
                    ))}
                </section>

                {selectedCompanyId !== 'all' && (
                    <section className="mb-8 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} className={categoryLinkClass('all')}>All</button>
                        {categoryOptions.map((category) => (
                            <button key={category.id} type="button" onClick={() => { setSelectedCategory(category.name); setCurrentPage(1); }} className={categoryLinkClass(category.name)}>{category.name}</button>
                        ))}
                    </section>
                )}

                <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    {displayedProducts.length === 0 && <div className="surface-card col-span-full p-8 text-center text-[var(--color-muted)]">등록된 제품이 아직 없습니다.</div>}
                    {displayedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </section>
            </div>

            {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="button-secondary min-h-10 px-3 disabled:cursor-not-allowed disabled:opacity-30">‹</button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`h-10 w-10 rounded-lg text-sm font-black transition ${currentPage === page ? 'bg-[var(--color-black)] text-white' : 'border border-[var(--color-line)] bg-white text-[var(--color-body)] hover:bg-[var(--color-pale)]'}`}>{page}</button>)}
                    <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="button-secondary min-h-10 px-3 disabled:cursor-not-allowed disabled:opacity-30">›</button>
                </div>
            )}
        </div>
    );
}
