'use client';

import { useState, useEffect } from 'react';

interface Inquiry {
    id: number;
    name: string;
    email: string;
    phone: string;
    company?: string;
    product?: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export default function InquiryTab() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthHeaders = (): HeadersInit => {
        const token = localStorage.getItem('adminToken');
        const headers = new Headers();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return headers;
    };

    // 컴포넌트가 화면에 나올 때 데이터 가져오기
    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/inquiries', {
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) setInquiries(data.inquiries);
        } catch (error) {
            console.error("문의 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    //삭제 로직
    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 문의 내역을 삭제하시겠습니까?")) return;

        try {
            // DELETE 요청 보내기
            const res = await fetch(`/api/inquiries/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("삭제되었습니다.");
                // 화면 목록에서 즉시 제거 (새로고침 안 해도 됨)
                setInquiries(prev => prev.filter(inq => inq.id !== id));
            } else {
                alert("삭제 실패: " + data.message);
            }
        } catch (error) {
            console.error("삭제 중 오류:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">접수된 문의 목록</h2>
                <button onClick={fetchInquiries} className="text-sm text-blue-500 hover:underline">
                    새로고침
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b bg-gray-100 text-gray-500 text-sm">
                            <th className="p-3 w-20">상태</th>
                            <th className="p-3 w-32">고객명</th>
                            <th className="p-3 w-40">이메일/연락처</th>
                            <th className="p-3">문의 내용 (통합)</th>
                            <th className="p-3 w-24">날짜</th>
                            <th className="p-3 w-16 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inquiries.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">접수된 문의가 없습니다.</td></tr>
                        ) : (
                            inquiries.map((inq) => (
                                <tr key={inq.id} className="border-b hover:bg-gray-50 text-sm">
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${!inq.isRead ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {!inq.isRead ? '신규' : '읽음'}
                                        </span>
                                    </td>
                                    <td className="p-3 font-bold">{inq.name}</td>
                                    <td className="p-3">
                                        <div className="text-gray-900">{inq.email}</div>
                                        <div className="text-gray-500 text-xs">{inq.phone}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1 items-start">
                                            {/* 1. 제품명 (있으면 파란색 배지) */}
                                            {inq.product && (
                                                <span className="">
                                                    제품명 : {inq.product}
                                                </span>
                                            )}

                                            {/* 2. 회사명 (있으면 회색 텍스트) */}
                                            {inq.company && (
                                                <span className="text-gray-500 text-xs font-medium">
                                                    {inq.company}
                                                </span>
                                            )}

                                            {/* 3. 문의 내용 (10자 제한 + 툴팁) */}
                                            <span className="">
                                                {inq.content.length > 10
                                                    ? inq.content.slice(0, 10) + "..."
                                                    : inq.content}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-400 text-xs">
                                        {new Date(inq.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleDelete(inq.id)}
                                            className="text-gray-400 hover:text-red-600 transition"
                                            title="삭제하기"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
