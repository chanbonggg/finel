'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inquiry } from '@/types/inquiry';

export function useInquiry() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInquiries = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/inquiries');
            const data = await res.json();
            if (data.success) {
                setInquiries(data.inquiries);
            }
        } catch (error) {
            console.error("문의 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 문의 내역을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/inquiries/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("삭제되었습니다.");
                setInquiries(prev => prev.filter(inq => inq.id !== id));
            } else {
                alert("삭제 실패: " + data.message);
            }
        } catch (error) {
            console.error("삭제 중 오류:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return { inquiries, isLoading, fetchInquiries, handleDelete };
}
