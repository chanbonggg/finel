import { Inquiry } from "@/types/inquiry";

interface InquiryItemProps {
    inquiry: Inquiry;
    onDelete: (id: number) => void;
}

export default function InquiryItem({ inquiry, onDelete }: InquiryItemProps) {
    return (
        <tr className="border-b hover:bg-gray-50 text-sm">
            <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${!inquiry.isRead ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                    {!inquiry.isRead ? '신규' : '읽음'}
                </span>
            </td>
            <td className="p-3 font-bold">{inquiry.name}</td>
            <td className="p-3">
                <div className="text-gray-900">{inquiry.email}</div>
                <div className="text-gray-500 text-xs">{inquiry.phone}</div>
            </td>
            <td className="p-3">
                <div className="flex flex-col gap-1 items-start">
                    {inquiry.product && (
                        <span className="">
                            제품명 : {inquiry.product}
                        </span>
                    )}
                    {inquiry.company && (
                        <span className="text-gray-500 text-xs font-medium">
                            {inquiry.company}
                        </span>
                    )}
                    <span className="">
                        {inquiry.content.length > 10
                            ? inquiry.content.slice(0, 10) + "..."
                            : inquiry.content}
                    </span>
                </div>
            </td>
            <td className="p-3 text-gray-400 text-xs">
                {new Date(inquiry.createdAt).toLocaleDateString()}
            </td>
            <td className="p-3 text-center">
                <button
                    onClick={() => onDelete(inquiry.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="삭제하기"
                >
                    삭제
                </button>
            </td>
        </tr>
    );
}
