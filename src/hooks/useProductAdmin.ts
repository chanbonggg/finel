'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, deleteCategory, getCategories } from '@/lib/api/categories';
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/lib/api/products';
import type { Category, Product } from '@/lib/api/types';

export type { Category, Product };

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

type SuccessResponse = { success: boolean; message?: string };
type CategoryMutationResponse = SuccessResponse & { category: Category };
type ProductMutationResponse = SuccessResponse & { product: Product };
type ErrorLike = Error & { status?: number; errorCode?: string; data?: { message?: string; errorCode?: string } };

function requireSuccess<T extends SuccessResponse>(result: T): T {
    if (result.success !== true) throw new Error(result.message || '요청에 실패했습니다.');
    return result;
}

function errorDetails(error: unknown): { status?: number; code?: string; message: string } {
    const value = error as ErrorLike;
    return {
        status: value?.status ?? (value as { response?: Response })?.response?.status,
        code: value?.errorCode ?? value?.data?.errorCode,
        message: value?.data?.message || value?.message || '서버 요청 중 오류가 발생했습니다.',
    };
}

export function useProductAdmin() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showApiError = useCallback((error: unknown, fallback: string) => {
        const { status, code, message } = errorDetails(error);
        if (status === 401) {
            alert('관리자 세션이 만료되었습니다. 다시 로그인해 주세요.');
            router.replace('/chanyoung/login');
            return;
        }
        if (status === 403 && code === 'CSRF_INVALID') {
            alert('보안 토큰이 만료되었습니다. 요청을 다시 실행해 주세요.');
            return;
        }
        const statusMessages: Record<number, string> = {
            400: message || '입력값을 확인해 주세요.',
            403: '이 작업을 수행할 권한이 없습니다.',
            404: '대상을 찾을 수 없습니다. 목록을 새로고침해 주세요.',
            409: message || '이미 존재하거나 사용 중인 항목입니다.',
            429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        };
        alert((status && statusMessages[status]) || message || fallback);
    }, [router]);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            setProducts(await getProducts({ includeHidden: true }));
        } catch (error) {
            showApiError(error, '제품 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [showApiError]);

    const fetchCategories = useCallback(async (companyId: number) => {
        try {
            setCategories(await getCategories(companyId));
        } catch (error) {
            showApiError(error, '카테고리 목록을 불러오지 못했습니다.');
        }
    }, [showApiError]);

    useEffect(() => { void fetchProducts(); }, [fetchProducts]);
    useEffect(() => {
        if (selectedCompanyId) {
            void fetchCategories(Number(selectedCompanyId));
            if (editingProductId === null) setNewProduct(previous => ({ ...previous, categoryId: '' }));
        } else {
            setCategories([]);
        }
    }, [editingProductId, fetchCategories, selectedCompanyId]);

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            alert('이미지 업로드 환경 설정을 확인해 주세요.');
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            const data = await response.json() as { secure_url?: string; error?: { message?: string } };
            if (!response.ok || !data.secure_url) throw new Error(data.error?.message || '이미지 업로드에 실패했습니다.');
            setNewProduct(previous => ({ ...previous, imageUrl: data.secure_url! }));
        } catch (error) {
            alert(errorDetails(error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) { alert('카테고리 이름을 입력해 주세요.'); return; }
        if (!selectedCompanyId) { alert('회사를 먼저 선택해 주세요.'); return; }
        try {
            const data = requireSuccess<CategoryMutationResponse>(await createCategory({ name, companyId: selectedCompanyId }));
            setCategories(previous => [...previous, data.category]);
            setNewProduct(previous => ({ ...previous, categoryId: String(data.category.id) }));
            setIsAddingCategory(false);
            setNewCategoryName('');
            alert(data.message || '카테고리가 추가되었습니다.');
        } catch (error) {
            showApiError(error, '카테고리를 추가하지 못했습니다.');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
        try {
            const data = requireSuccess<SuccessResponse>(await deleteCategory(id));
            setCategories(previous => previous.filter(category => category.id !== id));
            if (newProduct.categoryId === String(id)) setNewProduct(previous => ({ ...previous, categoryId: '' }));
            alert(data.message || '카테고리가 삭제되었습니다.');
        } catch (error) {
            showApiError(error, '카테고리를 삭제하지 못했습니다.');
        }
    };

    const resetForm = () => {
        setEditingProductId(null);
        setNewProduct({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
        setSelectedCompanyId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddProduct = async () => {
        const name = newProduct.name.trim();
        const spec = newProduct.spec.trim();
        if (!name || !newProduct.categoryId || !spec) {
            alert('제품명, 카테고리, 사양은 필수입니다.');
            return;
        }
        const payload = { ...newProduct, name, spec, categoryId: newProduct.categoryId };
        try {
            if (editingProductId !== null) {
                const data = requireSuccess<ProductMutationResponse>(await updateProduct(editingProductId, payload));
                setProducts(previous => previous.map(product => product.id === editingProductId ? data.product : product));
                alert(data.message || '제품 수정이 완료되었습니다.');
                resetForm();
            } else {
                const data = requireSuccess<ProductMutationResponse>(await createProduct(payload));
                setProducts(previous => [data.product, ...previous]);
                alert(data.message || '제품 등록이 완료되었습니다.');
                setNewProduct({ name: '', categoryId: '', spec: '', description: '', imageUrl: '' });
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (error) {
            showApiError(error, editingProductId !== null ? '제품을 수정하지 못했습니다.' : '제품을 등록하지 못했습니다.');
        }
    };

    const handleEditProduct = (productId: number) => {
        const product = products.find(item => item.id === productId);
        if (!product) { alert('제품 정보를 찾을 수 없습니다. 목록을 새로고침해 주세요.'); return; }
        setEditingProductId(productId);
        setSelectedCompanyId(product.companyId);
        setNewProduct({
            name: product.name,
            categoryId: String(product.categoryId),
            spec: product.spec,
            description: product.description,
            imageUrl: product.imageUrl || '',
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            const data = requireSuccess<SuccessResponse>(await deleteProduct(id));
            setProducts(previous => previous.filter(product => product.id !== id));
            alert(data.message || '제품이 삭제되었습니다.');
        } catch (error) {
            showApiError(error, '제품을 삭제하지 못했습니다.');
        }
    };

    const triggerFileInput = () => {
        if (!isUploading) fileInputRef.current?.click();
    };

    return {
        data: { products, categories, isLoading, isUploading, selectedCompanyId, newProduct, isAddingCategory, newCategoryName, editingProductId },
        actions: {
            setSelectedCompanyId, setNewProduct, setIsAddingCategory, setNewCategoryName, fetchProducts,
            handleImageUpload, handleAddCategory, handleDeleteCategory, handleAddProduct, handleDelete,
            handleEditProduct, handleCancelEdit: resetForm, triggerFileInput,
        },
        refs: { fileInputRef },
    };
}
