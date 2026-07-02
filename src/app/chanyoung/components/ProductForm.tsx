import { PARTNERS } from '@/constants/partners';
import Image from 'next/image';
import { FormField, AdminInput, AdminTextarea } from '../AdminUI';
import CategoryManager from './CategoryManager';
import { useProductAdmin } from '@/hooks/useProductAdmin';

// useProductAdmin의 리턴 타입을 활용하거나 필요한 부분만 정의
type ProductAdminHook = ReturnType<typeof useProductAdmin>;

interface Props {
    data: ProductAdminHook['data'];
    actions: ProductAdminHook['actions'];
    refs: ProductAdminHook['refs'];
}

export default function ProductForm({ data, actions, refs }: Props) {
    const { newProduct, selectedCompanyId, categories, isUploading, isAddingCategory, newCategoryName, editingProductId } = data;
    const { setSelectedCompanyId, setNewProduct, triggerFileInput, handleImageUpload, handleAddProduct, setIsAddingCategory, setNewCategoryName, handleAddCategory, handleDeleteCategory, handleCancelEdit } = actions;
    const { fileInputRef } = refs;

    return (
        <div className="mb-10 bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-5 text-gray-700 flex items-center gap-2">
                {editingProductId ? "제품 정보 수정하기" : "새 제품 등록하기"}
            </h3>

            {/* 1. 회사 선택 */}
            <div className="mb-6 space-y-2">
                <FormField label="회사(Partner) 선택" required>
                    <div className="flex gap-4 flex-wrap">
                        {PARTNERS.map(partner => (
                            <button
                                key={partner.id}
                                onClick={() => setSelectedCompanyId(partner.id)}
                                disabled={Boolean(editingProductId)}
                                className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
                                    editingProductId
                                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                        : selectedCompanyId === partner.id
                                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="font-bold uppercase">{partner.name}</span>
                            </button>
                        ))}
                    </div>
                </FormField>
            </div>

            {selectedCompanyId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {/* 왼쪽: 이미지 업로드 */}
                    <div className="lg:col-span-1">
                        <FormField label="제품 사진">
                            <div
                                onClick={triggerFileInput}
                                className={`
                                    relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition overflow-hidden bg-white
                                    ${isUploading ? 'bg-gray-100 border-gray-300' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/30'}
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                                {isUploading ? (
                                    <div className="text-center animate-pulse">
                                        <div className="text-4xl mb-2">업로드</div>
                                        <span className="text-sm font-bold text-gray-500">업로드 중...</span>
                                    </div>
                                ) : newProduct.imageUrl ? (
                                    <>
                                        <Image src={newProduct.imageUrl} alt="미리보기" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                            <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full text-sm">🔄 사진 변경</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="text-4xl mb-2">사진 업로드</div>
                                        <p className="text-sm font-bold text-gray-600">클릭해서 사진 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">또는 파일을 여기로 드래그</p>
                                    </div>
                                )}
                            </div>
                        </FormField>
                    </div>

                    {/* 오른쪽: 입력 필드 */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="제품명" required>
                                <AdminInput
                                    placeholder="예: 고성능 모터 Z-1"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </FormField>

                            <FormField label="카테고리" required>
                                <CategoryManager
                                    categories={categories}
                                    selectedCategoryId={newProduct.categoryId}
                                    onSelectCategory={(id) => setNewProduct({ ...newProduct, categoryId: id })}
                                    isAdding={isAddingCategory}
                                    onToggleAdding={setIsAddingCategory}
                                    newCategoryName={newCategoryName}
                                    onNewCategoryNameChange={setNewCategoryName}
                                    onAdd={handleAddCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            </FormField>
                        </div>

                        <FormField label="사양 (Spec)" required>
                            <AdminInput
                                placeholder="예: 220V / 60Hz / 3000RPM"
                                value={newProduct.spec}
                                onChange={e => setNewProduct({ ...newProduct, spec: e.target.value })}
                            />
                        </FormField>

                        <FormField label="상세 설명">
                            <AdminTextarea
                                className="h-24"
                                placeholder="제품의 특징이나 상세 내용을 입력하세요."
                                value={newProduct.description}
                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                        </FormField>

                        <button
                            onClick={handleAddProduct}
                            disabled={isUploading}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition transform active:scale-[0.99]
                                ${isUploading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                                }`
                            }
                        >
                            {isUploading ? "이미지 처리 중입니다..." : (editingProductId ? "수정 완료" : "제품 등록 완료")}
                        </button>

                        {editingProductId && (
                            <button
                                onClick={handleCancelEdit}
                                className="w-full py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                            >
                                취소
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
