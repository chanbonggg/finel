'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInquiry, getInquiries } from '@/lib/api/inquiries';
import type { Inquiry } from '@/lib/api/types';

type SuccessResponse = { success: boolean; message?: string };
type ErrorLike = Error & { status?: number; errorCode?: string; data?: { message?: string; errorCode?: string } };

function requireSuccess(result: SuccessResponse): SuccessResponse {
    if (result.success !== true) throw new Error(result.message || '요청에 실패했습니다.');
    return result;
}

export function useInquiry() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleError = useCallback((error: unknown, fallback: string) => {
        const value = error as ErrorLike & { response?: Response };
        const status = value?.status ?? value?.response?.status;
        const code = value?.errorCode ?? value?.data?.errorCode;
        const message = value?.data?.message || value?.message;
        if (status === 401) {
            alert('관리자 세션이 만료되었습니다. 다시 로그인해 주세요.');
            router.replace('/chanyoung/login');
        } else if (status === 403 && code === 'CSRF_INVALID') {
            alert('보안 토큰이 만료되었습니다. 요청을 다시 실행해 주세요.');
        } else if (status === 403) {
            alert('이 작업을 수행할 권한이 없습니다.');
        } else if (status === 404) {
            alert('문의 내역을 찾을 수 없습니다. 목록을 새로고침해 주세요.');
        } else if (status === 429) {
            alert('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
        } else {
            alert(message || fallback);
        }
    }, [router]);

    const fetchInquiries = useCallback(async () => {
        setIsLoading(true);
        try {
            setInquiries(await getInquiries());
        } catch (error) {
            handleError(error, '문의 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    useEffect(() => { void fetchInquiries(); }, [fetchInquiries]);

    const handleDelete = async (id: number) => {
        if (!confirm('정말 이 문의 내역을 삭제하시겠습니까?')) return;
        try {
            const data = requireSuccess(await deleteInquiry(id));
            setInquiries(previous => previous.filter(inquiry => inquiry.id !== id));
            alert(data.message || '삭제되었습니다.');
        } catch (error) {
            handleError(error, '문의 내역을 삭제하지 못했습니다.');
        }
    };

    return { inquiries, isLoading, fetchInquiries, handleDelete };
}
