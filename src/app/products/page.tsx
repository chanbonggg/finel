'use client'; // 1. 데이터를 가져오려면(fetch) 클라이언트 컴포넌트여야 합니다.

import { useState, useEffect, useMemo } from 'react'; // React 기능 가져오기
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

// 제품 데이터 타입 정의 (DB랑 맞춰줍니다)
interface Product {
    id: number;
    name: string;
    category: string;
    spec: string;
    description: string;
    imageUrl?: string; // 이미지는 없을 수도 있음
}

interface Category {
    id: number | string;
    name: string;
}

export default function ProductsPage() {
    // 2. [변경된 부분] 가짜 데이터 대신 '빈 통(State)'을 만듭니다.
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category') || 'all';

    // 3. [변경된 부분] 페이지가 열리면 서버에서 데이터를 가져옵니다.
    useEffect(() => {
        async function fetchProductsAndCategories() {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/categories'),
                ]);
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                if (productsData.success) {
                    setProducts(productsData.products); // 성공하면 통에 데이터 채우기
                }
                if (categoriesData.success) {
                    setCategories(categoriesData.categories);
                }
            } catch (error) {
                console.error("제품 불러오기 실패:", error);
            } finally {
                setLoading(false); // 로딩 끝
            }
        }

        fetchProductsAndCategories();
    }, []);

    const categoryOptions = useMemo(() => {
        if (categories.length > 0) {
            return categories;
        }
        const uniqueNames = Array.from(new Set(products.map((product) => product.category)));
        return uniqueNames.map((name) => ({ id: name, name }));
    }, [categories, products]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'all') {
            return products;
        }
        return products.filter((product) => product.category === selectedCategory);
    }, [products, selectedCategory]);

    const categoryLinkClass = (categoryName: string) =>
        selectedCategory === categoryName
            ? "px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-bold"
            : "px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition";

    // 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="p-20 text-center text-gray-500">제품 목록을 불러오는 중...</div>;
    }

    return (
        <div className="py-10">

            {/* 헤더 섹션 */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Products Lineup</h1>
                <p className="text-gray-600">
                    고객의 비즈니스 환경에 최적화된 다양한 솔루션을 만나보세요.<br />
                    세부 스펙 변경 및 커스텀 제작은 별도 문의 부탁드립니다.
                </p>
            </section>

            {/* Category navigation */}
            <section className="flex flex-wrap justify-center gap-3 px-4 mb-12">
                <Link href="/products" className={categoryLinkClass('all')}>
                    All
                </Link>
                {categoryOptions.map((category) => (
                    <Link
                        key={category.id}
                        href={`/products?category=${encodeURIComponent(category.name)}`}
                        className={categoryLinkClass(category.name)}
                    >
                        {category.name}
                    </Link>
                ))}
            </section>

            {/* 제품 리스트 그리드 */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {/* 제품이 하나도 없을 때 안내 메시지 */}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl">
                        등록된 제품이 아직 없습니다. 관리자 페이지에서 추가해주세요.
                    </div>
                )}

                {filteredProducts.map((product) => (
                    <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 bg-white group flex flex-col"
                    >
                        {/* 1. 제품 이미지 영역 */}
                        {/* 이미지가 있으면 이미지 표시, 없으면 파란 박스 표시 */}
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
                                {product.category}
                            </span>
                        </div>

                        {/* 2. 제품 정보 영역 */}
                        <div className="p-6 flex flex-col flex-grow">
                            {/* 스펙 강조 */}
                            <div className="text-blue-600 text-sm font-bold mb-2 uppercase tracking-wide">
                                Spec: {product.spec}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                {product.name}
                            </h3>
                        </div>
                    </Link>
                ))}
            </section>

        </div>
    );
}
