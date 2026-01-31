'use client';

import { useProductAdmin } from '@/hooks/useProductAdmin';
import ProductForm from './components/ProductForm';
import ProductTable from './components/ProductTable';

export default function ProductTab() {
    const { data, actions, refs } = useProductAdmin();

    // --- 화면 렌더링 ---
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">제품 관리</h2>
                <button onClick={actions.fetchProducts} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition">
                    목록 새로고침
                </button>
            </div>

            <ProductForm data={data} actions={actions} refs={refs} />
            <ProductTable products={data.products} isLoading={data.isLoading} onDelete={actions.handleDelete} />
        </div>
    );
}
