'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ProductDetail {
    id: number;
    name: string;
    spec: string;
    description: string;
    imageUrl?: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            setError('제품 정보를 찾을 수 없습니다.');
            return;
        }

        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products/${productId}`);
                const data = await res.json();

                if (!data.success) {
                    setError(data.message || '제품 정보를 불러오지 못했습니다.');
                    return;
                }

                setProduct(data.product);
            } catch (fetchError) {
                console.error('제품 상세 불러오기 실패:', fetchError);
                setError('제품 정보를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [productId]);

    if (loading) {
        return <div className="p-20 text-center text-gray-500">제품 상세를 불러오는 중...</div>;
    }

    if (error) {
        return (
            <div className="p-20 text-center text-gray-500">
                <p className="mb-6">{error}</p>
                <Link href="/products" className="text-blue-600 font-bold hover:underline">
                    제품 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-20 text-center text-gray-500">
                <p className="mb-6">제품 정보를 찾을 수 없습니다.</p>
                <Link href="/products" className="text-blue-600 font-bold hover:underline">
                    제품 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">
                    ← 제품 목록
                </Link>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-400 font-bold text-xl py-20">No Image</span>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <div className="text-blue-600 text-sm font-bold uppercase tracking-wide mb-3">
                            Spec: {product.spec}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{product.name}</h1>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
