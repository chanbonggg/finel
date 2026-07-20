'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InquiryTab from '@/features/admin/components/InquiryTap'
import ProductTab from '@/features/admin/components/ProductTap';
import { logout } from '@/lib/api/auth';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("inquiry");
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
            router.replace('/chanyoung/login');
        } catch (error) {
            const value = error as Error & { status?: number; data?: { message?: string } };
            alert(value.data?.message || value.message || '로그아웃에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* 상단 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">관리자님 환영합니다 </span>
                        <button onClick={handleLogout} disabled={isLoggingOut} className="text-sm text-red-500 hover:underline disabled:text-gray-400">
                            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        </button>
                    </div>
                </div>

                {/* 탭 버튼 */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("inquiry")}
                        className={`px-6 py-2 rounded-lg font-bold ${activeTab === "inquiry" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                    >
                        문의 내역
                    </button>
                    <button
                        onClick={() => setActiveTab("product")}
                        className={`px-6 py-2 rounded-lg font-bold ${activeTab === "product" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                    >
                        제품 관리
                    </button>
                </div>

                {/* 탭 내용 보여주기 (조건부 렌더링) */}
                {activeTab === "inquiry" && <InquiryTab />}
                {activeTab === "product" && <ProductTab />}
            </div>
        </div>
    );
}
