import { useState, useEffect, ChangeEvent, useRef } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface Product {
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

export interface Category {
    id: number;
    name: string;
    companyId: number;
}

export function useProductAdmin() {
    // --- 상태 관리 ---
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // 선택된 회사 ID
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
    // 수정 모드
    const [editingProductId, setEditingProductId] = useState<number | null>(null);

    const [newProduct, setNewProduct] = useState({
        name: '',
        categoryId: '',
        spec: '',
        description: '',
        imageUrl: ''
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

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
            const res = await fetch('/api/products');
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
            const res = await fetch(`/api/categories?companyId=${companyId}`);
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
        if (!selectedCompanyId) {
            alert("회사를 먼저 선택해주세요.");
            return;
        }

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName, companyId: selectedCompanyId })
            });

            const data = await res.json();

            if (data.success) {
                alert("카테고리 추가됨");
                setCategories(prev => [...prev, data.category]);
                setNewProduct(prev => ({ ...prev, categoryId: String(data.category.id) }));
                setIsAddingCategory(false);
                setNewCategoryName("");
            } else {
                alert(`카테고리 추가 실패: ${data.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            alert("카테고리 추가 중 서버 오류가 발생했습니다.");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
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

    // --- 제품 등록 / 수정 ---
    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.categoryId) {
            alert("제품명과 카테고리는 필수입니다.");
            return;
        }

        try {
            if (editingProductId) {
                // 수정 모드
                const res = await fetch(`/api/products/${editingProductId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct),
                });
                const data = await res.json();
                if (data.success) {
                    alert("제품 수정 완료!");
                    fetchProducts();
                    handleCancelEdit();
                } else {
                    alert(`수정 실패: ${data.message}`);
                }
            } else {
                // 추가 모드
                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct),
                });
                const data = await res.json();

                if (data.success) {
                    alert("제품 등록 완료!");
                    fetchProducts(); // 목록 새로고침
                    setNewProduct({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } else {
                    alert(`등록 실패: ${data.message || '알 수 없는 오류'}`);
                }
            }
        } catch (error) {
            alert("제품 처리 중 서버 오류가 발생했습니다.");
        }
    };

    // --- 제품 수정 모드 진입 ---
    const handleEditProduct = async (productId: number) => {
        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();
            if (data.success) {
                const product = data.product;
                setEditingProductId(productId);
                setSelectedCompanyId(product.companyId);
                setTimeout(() => {
                    setNewProduct({
                        name: product.name,
                        categoryId: String(product.categoryId),
                        spec: product.spec,
                        description: product.description,
                        imageUrl: product.imageUrl || ''
                    });
                }, 100);
            }
        } catch (error) {
            alert("제품 정보를 불러올 수 없습니다.");
        }
    };

    // --- 제품 수정 모드 취소 ---
    const handleCancelEdit = () => {
        setEditingProductId(null);
        setNewProduct({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
        setSelectedCompanyId("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- 제품 삭제 ---
    const handleDelete = async (id: number) => {
        if (!confirm("삭제하시겠습니까?")) return;
        await fetch(`/api/products/${id}`, {
            method: 'DELETE',
        });
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    //  큰 박스 클릭 시 파일 선택창 열기 (편의 기능)
    const triggerFileInput = () => {
        if (fileInputRef.current && !isUploading) {
            fileInputRef.current.click();
        }
    };

    return {
        data: {
            products,
            categories,
            isLoading,
            isUploading,
            selectedCompanyId,
            newProduct,
            isAddingCategory,
            newCategoryName,
            editingProductId,
        },
        actions: {
            setSelectedCompanyId,
            setNewProduct,
            setIsAddingCategory,
            setNewCategoryName,
            fetchProducts,
            handleImageUpload,
            handleAddCategory,
            handleDeleteCategory,
            handleAddProduct,
            handleDelete,
            handleEditProduct,
            handleCancelEdit,
            triggerFileInput
        },
        refs: {
            fileInputRef
        }
    };
}