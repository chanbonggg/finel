import type { Inquiry } from '@/lib/api/types';
import InquiryItem from "./InquiryItem";

interface InquiryListProps {
    inquiries: Inquiry[];
    onDelete: (id: number) => void;
}

export default function InquiryList({ inquiries, onDelete }: InquiryListProps) {
    return (
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
                    <tr><td colSpan={6} className="p-10 text-center text-gray-400">접수된 문의가 없습니다.</td></tr>
                ) : (
                    inquiries.map((inq) => (
                        <InquiryItem key={inq.id} inquiry={inq} onDelete={onDelete} />
                    ))
                )}
            </tbody>
        </table>
    );
}
