'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InquiryTab from '@/app/admin/InquiryTap'
import ProductTab from '@/app/admin/ProductTap';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("inquiry");
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout');
        } catch {
            // 실패해도 로그인 페이지로 이동
        } finally {
            router.replace('/admin/login');
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
                        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">로그아웃</button>
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
