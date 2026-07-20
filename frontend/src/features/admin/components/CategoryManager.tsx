import type { Category } from '@/lib/api/types';
import { AdminSelect, AdminInput } from './AdminUI';

interface Props {
    categories: Category[];
    selectedCategoryId: string | number;
    onSelectCategory: (id: string) => void;
    isAdding: boolean;
    onToggleAdding: (isAdding: boolean) => void;
    newCategoryName: string;
    onNewCategoryNameChange: (name: string) => void;
    onAdd: () => void;
    onDelete: (id: number) => void;
}

export default function CategoryManager({
    categories,
    selectedCategoryId,
    onSelectCategory,
    isAdding,
    onToggleAdding,
    newCategoryName,
    onNewCategoryNameChange,
    onAdd,
    onDelete
}: Props) {
    if (!isAdding) {
        return (
            <div className="flex gap-2">
                <AdminSelect
                    value={selectedCategoryId}
                    onChange={(e) => onSelectCategory(e.target.value)}
                >
                    <option value="">선택해주세요</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </AdminSelect>
                <button
                    onClick={() => onToggleAdding(true)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded-lg text-sm font-bold transition whitespace-nowrap"
                >
                    ⚙️ 관리
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 animate-fadeIn">
            {/* 카테고리 추가 입력창 */}
            <div className="flex gap-2 mb-3">
                <AdminInput
                    placeholder="새 카테고리 이름"
                    value={newCategoryName}
                    onChange={(e) => onNewCategoryNameChange(e.target.value)}
                    autoFocus
                />
                <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg font-bold whitespace-nowrap">추가</button>
                <button onClick={() => onToggleAdding(false)} className="text-gray-500 hover:text-gray-700 px-2 font-bold whitespace-nowrap">닫기</button>
            </div>

            {/* 삭제 가능한 카테고리 목록 */}
            <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-xs text-gray-500 mb-2 font-bold">목록 편집 (빈 카테고리만 삭제 가능)</p>
                <ul className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {categories.map((cat) => (
                        <li key={cat.id} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 text-sm shadow-sm">
                            <span className="text-gray-700">{cat.name}</span>
                            <button
                                onClick={() => onDelete(cat.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                                title="삭제하기"
                            >
                                🗑️
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
