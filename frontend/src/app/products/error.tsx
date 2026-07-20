'use client';

import { useEffect } from 'react';

export default function ProductsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('제품 화면 오류:', error);
    }, [error]);

    return (
        <div className="py-20 px-4 text-center" role="alert">
            <h1 className="text-2xl font-bold text-gray-900">제품 정보를 불러오지 못했습니다.</h1>
            <p className="mt-3 text-gray-600">잠시 후 다시 시도해주세요.</p>
            <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
                다시 시도
            </button>
        </div>
    );
}
