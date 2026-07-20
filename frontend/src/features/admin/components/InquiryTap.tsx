'use client';

import { useInquiry } from '@/features/contact/hooks/useInquiry';
import InquiryList from './InquiryList';

export default function InquiryTab() {
    const { inquiries, isLoading, fetchInquiries, handleDelete } = useInquiry();

    return (
        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">접수된 문의 목록</h2>
                <button
                    onClick={fetchInquiries}
                    className="text-sm text-blue-500 hover:underline"
                    disabled={isLoading}
                >
                    {isLoading ? '새로고침 중...' : '새로고침'}
                </button>
            </div>

            {isLoading && inquiries.length === 0 ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <InquiryList inquiries={inquiries} onDelete={handleDelete} />
            )}
        </div>
    );
}
