import { Product } from '@/hooks/useProductAdmin';

interface Props {
    products: Product[];
    isLoading: boolean;
    onDelete: (id: number) => void;
    onEdit: (id: number) => void;
}

export default function ProductTable({ products, isLoading, onDelete, onEdit }: Props) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                        <th className="p-4 w-24 text-center">이미지</th>
                        <th className="p-4 w-32">카테고리</th>
                        <th className="p-4">제품 정보</th>
                        <th className="p-4 w-24 text-center">관리</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                        <tr><td colSpan={4} className="p-10 text-center text-gray-500">데이터를 불러오는 중입니다...</td></tr>
                    ) : products.length === 0 ? (
                        <tr><td colSpan={4} className="p-10 text-center text-gray-400">등록된 제품이 없습니다.</td></tr>
                    ) : products.map(prod => (
                        <tr key={prod.id} className="hover:bg-blue-50/50 transition duration-150">
                            <td className="p-4 text-center">
                                <div className="w-16 h-16 bg-white rounded-lg border border-gray-100 p-1 mx-auto shadow-sm">
                                    {prod.imageUrl ? (
                                        <img src={prod.imageUrl} className="w-full h-full object-cover rounded" alt={prod.name} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xs text-gray-300 rounded">No Img</div>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 align-top pt-6">
                                <span className="inline-block bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">
                                    {prod.category}
                                </span>
                            </td>
                            <td className="p-4 align-middle">
                                <h4 className="font-bold text-gray-900 text-base mb-1">{prod.name}</h4>
                                <p className="text-sm text-gray-500 font-medium mb-1">pin {prod.spec}</p>
                                <p className="text-xs text-gray-400 line-clamp-1">{prod.description}</p>
                            </td>
                            <td className="p-4 text-center align-middle">
                                <button
                                    onClick={() => onEdit(prod.id)}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition mr-2"
                                    title="수정하기"
                                >
                                    수정
                                </button>
                                <button
                                    onClick={() => onDelete(prod.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                    title="삭제하기"
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
