'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { PARTNERS } from '@/constants/partners';

// ✅ [환경 변수]
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ✅ [타입 정의] 빠진 부분 없이 꼼꼼하게 채웠습니다.
interface Product {
    id: number;
    name: string;
    category: string;
    categoryId: number;
    spec: string;
    description: string;
    imageUrl?: string;
    isVisible: boolean;
    createdAt: string;
}

interface Category {
    id: number;
    name: string;
    companyId: number;
}

export default function ProductTab() {
    // --- 상태 관리 ---
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // 선택된 회사 ID
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");

    const [newProduct, setNewProduct] = useState({
        name: '',
        categoryId: '',
        spec: '',
        description: '',
        imageUrl: ''
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const getAuthHeaders = (): HeadersInit => {
        const token = localStorage.getItem('adminToken');
        const headers = new Headers();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return headers;
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 초기 데이터 로딩 ---
    useEffect(() => {
        fetchProducts();
    }, []);

    // 회사가 선택되면 해당 회사의 카테고리만 불러옴
    useEffect(() => {
        if (selectedCompanyId) {
            fetchCategories(Number(selectedCompanyId));
            setNewProduct(prev => ({ ...prev, categoryId: '' })); // 회사 변경 시 카테고리 초기화
        } else {
            setCategories([]);
        }
    }, [selectedCompanyId]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/products', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setProducts(data.products);
        } catch (error) {
            console.error("제품 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async (companyId: number) => {
        try {
            const res = await fetch(`/api/categories?companyId=${companyId}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setCategories(data.categories);
        } catch (error) {
            console.error("카테고리 로딩 실패:", error);
        }
    };

    // --- 이미지 업로드 (Cloudinary) ---
    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            alert("환경 변수 설정 오류: .env.local 파일을 확인하세요.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.secure_url) {
                setNewProduct(prev => ({ ...prev, imageUrl: data.secure_url }));
            }
        } catch (error) {
            alert("이미지 업로드 실패");
        } finally {
            setIsUploading(false);
        }
    };

    // --- 카테고리 추가 ---
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (!selectedCompanyId) return alert("회사를 먼저 선택해주세요.");
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ name: newCategoryName, companyId: selectedCompanyId })
            });
            const data = await res.json();
            if (data.success) {
                alert("카테고리 추가됨");
                setCategories(prev => [...prev, data.category]);
                setNewProduct(prev => ({ ...prev, categoryId: String(data.category.id) }));
                setIsAddingCategory(false);
                setNewCategoryName("");
            }
        } catch (error) {
            alert("카테고리 추가 실패");
        }
    }; const handleDeleteCategory = async (id: number) => {
        if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await res.json();

            if (data.success) {
                alert("카테고리가 삭제되었습니다.");
                // 화면 목록에서 즉시 제거
                setCategories(prev => prev.filter(c => c.id !== id));
                // 만약 삭제한 카테고리가 선택되어 있었다면 초기화
                if (newProduct.categoryId === String(id)) {
                    setNewProduct(prev => ({ ...prev, categoryId: '' }));
                }
            } else {
                alert(data.message); // "제품이 있어서 삭제 못함" 경고 띄우기
            }
        } catch (error) {
            alert("삭제 실패");
        }
    };

    // --- 제품 등록 ---
    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.categoryId) return alert("제품명과 카테고리는 필수입니다.");

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(newProduct),
            });
            const data = await res.json();

            if (data.success) {
                alert("제품 등록 완료!");
                fetchProducts(); // 목록 새로고침
                setNewProduct({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                alert("등록 실패: " + data.message);
            }
        } catch (error) {
            alert("서버 오류");
        }
    };

    // --- 제품 삭제 ---
    const handleDelete = async (id: number) => {
        if (!confirm("삭제하시겠습니까?")) return;
        await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    //  큰 박스 클릭 시 파일 선택창 열기 (편의 기능)
    const triggerFileInput = () => {
        if (fileInputRef.current && !isUploading) {
            fileInputRef.current.click();
        }
    };

    // --- 화면 렌더링 ---
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">제품 관리</h2>
                <button onClick={fetchProducts} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition">
                    목록 새로고침
                </button>
            </div>

            {/* --- 등록 폼 --- */}
            <div className="mb-10 bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-5 text-gray-700 flex items-center gap-2">
                    새 제품 등록하기
                </h3>

                {/* 1. 회사 선택 (가장 먼저 해야 함) */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">회사(Partner) 선택 <span className="text-red-500">*</span></label>
                    <div className="flex gap-4 flex-wrap">
                        {PARTNERS.map(partner => (
                            <button
                                key={partner.id}
                                onClick={() => setSelectedCompanyId(partner.id)}
                                className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
                                    selectedCompanyId === partner.id 
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="font-bold uppercase">{partner.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedCompanyId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

                    {/* 왼쪽: 이미지 업로드 구역 (디자인 대폭 변경) */}
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">제품 사진</label>

                        <div
                            onClick={triggerFileInput}
                            className={`
                                relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition overflow-hidden bg-white
                                ${isUploading ? 'bg-gray-100 border-gray-300' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/30'}
                            `}
                        >
                            {/* 실제 파일 입력창은 숨김 */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                className="hidden"
                            />

                            {/* 상태에 따른 UI 표시 */}
                            {isUploading ? (
                                <div className="text-center animate-pulse">
                                    <div className="text-4xl mb-2">업로드</div>
                                    <span className="text-sm font-bold text-gray-500">업로드 중...</span>
                                </div>
                            ) : newProduct.imageUrl ? (
                                <>
                                    <img src={newProduct.imageUrl} alt="미리보기" className="w-full h-full object-cover" />
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
                    </div>

                    {/* 오른쪽: 텍스트 입력 구역 */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">제품명 <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
                                    placeholder="예: 고성능 모터 Z-1"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">카테고리 <span className="text-red-500">*</span></label>
                                {!isAddingCategory ? (
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition bg-white"
                                            value={newProduct.categoryId}
                                            onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                                        >
                                            <option value="">선택해주세요</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsAddingCategory(true)}
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded-lg text-sm font-bold transition whitespace-nowrap"
                                        >
                                            ⚙️ 관리
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 animate-fadeIn">
                                        {/* 1. 카테고리 추가 입력창 */}
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="새 카테고리 이름"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg font-bold whitespace-nowrap">추가</button>
                                            <button onClick={() => setIsAddingCategory(false)} className="text-gray-500 hover:text-gray-700 px-2 font-bold whitespace-nowrap">닫기</button>
                                        </div>

                                        {/* 2. [NEW] 삭제 가능한 카테고리 목록 보여주기 */}
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                            <p className="text-xs text-gray-500 mb-2 font-bold">목록 편집 (빈 카테고리만 삭제 가능)</p>
                                            <ul className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                {categories.map(cat => (
                                                    <li key={cat.id} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 text-sm shadow-sm">
                                                        <span className="text-gray-700">{cat.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat.id)}
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
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">사양 (Spec)</label>
                            <input
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
                                placeholder="예: 220V / 60Hz / 3000RPM"
                                value={newProduct.spec}
                                onChange={e => setNewProduct({ ...newProduct, spec: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">상세 설명</label>
                            <textarea
                                className="w-full border border-gray-300 p-2.5 rounded-lg h-24 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition resize-none"
                                placeholder="제품의 특징이나 상세 내용을 입력하세요."
                                value={newProduct.description}
                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                        </div>

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
                            {isUploading ? "이미지 처리 중입니다..." : "제품 등록 완료"}
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* --- 리스트 테이블 --- */}
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
                                        onClick={() => handleDelete(prod.id)}
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
        </div>
    );
}
