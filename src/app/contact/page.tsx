'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts } from '@/lib/api/products';
import { createInquiry } from '@/lib/api/inquiries';
import type { Product } from '@/lib/api/products';
import { isApiError } from '@/lib/api/client';

function ContactContent() {
    const searchParams = useSearchParams();
    const initialProduct = searchParams.get('product');

    // DB에서 가져온 제품 목록을 담을 통
    const [dbProducts, setDbProducts] = useState<Product[]>([]);

    // 입력값 상태 관리
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        product: '',
        message: '',
        agreed: false,
        honey: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productsLoadFailed, setProductsLoadFailed] = useState(false);

    // 페이지가 열리면 서버에서 '진짜 제품 목록'을 가져옵니다.
    useEffect(() => {
        async function fetchProducts() {
            try {
                setProductsLoadFailed(false);
                setDbProducts(await getProducts());
            } catch (error) {
                console.error("제품 목록 로딩 실패:", error);
                setProductsLoadFailed(true);
            }
        }
        fetchProducts();
    }, []);

    // 3. URL에 제품이 있으면 자동으로 선택 (기존과 동일)
    useEffect(() => {
        if (initialProduct) {
            setFormData(prev => ({ ...prev, product: initialProduct }));
        }
    }, [initialProduct]);

    // 입력값 변경 처리
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 동의 체크박스 처리
    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, agreed: e.target.checked }));
    };

    // 전송 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.honey) return; // 봇 차단

        if (formData.product === "") {
            alert("문의하실 제품을 선택해주세요.");
            return;
        }

        if (!formData.message.trim()) {
            alert("문의 내용을 입력해주세요.");
            return;
        }

        if (!formData.agreed) {
            alert("개인정보 수집 및 이용에 동의해주세요.");
            return;
        }

        setIsSubmitting(true);

        try {
            await createInquiry({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    productName: formData.product,
                    company: formData.company,
                    message: formData.message,
                });

            alert(`문의가 성공적으로 접수되었습니다!\n담당자가 ${formData.phone}으로 곧 연락드리겠습니다.`);
            setFormData({
                name: '', company: '', phone: '', email: '', product: '', message: '', agreed: false, honey: ''
            });

        } catch (error) {
            console.error("전송 에러:", error);

            if (isApiError(error) && error.status === 502 && error.data?.inquirySaved === true) {
                alert(`문의가 성공적으로 접수되었습니다!\n담당자가 ${formData.phone}으로 곧 연락드리겠습니다.`);
                setFormData({
                    name: '', company: '', phone: '', email: '', product: '', message: '', agreed: false, honey: ''
                });
            } else if (isApiError(error) && error.status === 400) {
                alert(error.message || "입력 내용을 확인해주세요.");
            } else if (isApiError(error) && error.status === 429) {
                alert("문의 요청이 너무 많습니다. 10분 후 다시 시도해주세요.");
            } else if (isApiError(error) && error.status === 500) {
                alert("문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
            } else {
                alert("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="site-section">
            <div className="site-container grid grid-cols-[0.82fr_1.18fr] items-start gap-6 max-lg:grid-cols-1">
            <aside className="surface-card-lg p-7">
                <p className="site-eyebrow">Contact</p>
                <h1 className="site-title">견적 및 제휴 문의</h1>
                <p className="site-copy mt-4">
                    제품 도입을 위한 전문 상담을 신청하세요. 담당자가 확인 후
                    신속하게 연락드립니다.
                </p>

                <div className="mt-7 grid gap-3">
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)] p-4">
                        <span className="mb-1 block text-xs font-black text-[var(--color-muted)]">전화 문의</span>
                        <a href="tel:02-2693-3569" className="font-black text-[var(--color-ink)]">02-2693-3569</a>
                    </div>
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)] p-4">
                        <span className="mb-1 block text-xs font-black text-[var(--color-muted)]">팩스</span>
                        <span className="font-black text-[var(--color-ink)]">032-232-8823</span>
                    </div>
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-pale)] p-4">
                        <span className="mb-1 block text-xs font-black text-[var(--color-muted)]">주소</span>
                        <span className="break-keep font-black text-[var(--color-ink)]">인천광역시 동구 방축로 37번길 30, 2동 206호</span>
                    </div>
                </div>
            </aside>

            <form onSubmit={handleSubmit} className="surface-card-lg relative p-6 md:p-8">
                {/* Honeypot */}
                <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden">
                    <input type="text" name="honey" value={formData.honey} onChange={handleChange} tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className="mb-2 block text-sm font-black text-[var(--color-body)]">담당자 성함 *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="form-field" placeholder="홍길동" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-black text-[var(--color-body)]">회사명 / 단체명</label>
                        <input type="text" name="company" value={formData.company} onChange={handleChange} className="form-field" placeholder="(주)우리회사" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div>
                        <label className="mb-2 block text-sm font-black text-[var(--color-body)]">연락처 *</label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="form-field" placeholder="010-1234-5678" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-black text-[var(--color-body)]">이메일 (선택)</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-field" placeholder="help@company.com" />
                    </div>
                </div>

                {/* 4. [NEW] 관심 제품 선택 (DB 데이터 연동) */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-black text-[var(--color-body)]">관심 제품 선택 *</label>
                    <div className="relative">
                        <select
                            name="product"
                            required
                            value={formData.product}
                            onChange={handleChange}
                            className="form-field appearance-none cursor-pointer"
                        >
                            <option value="" disabled>문의하실 제품을 선택해주세요 (클릭)</option>

                            {/* DB에서 가져온 데이터가 없으면 로딩 중 표시 */}
                            {dbProducts.length === 0 && (
                                <option disabled>{productsLoadFailed ? '제품 목록을 불러오지 못했습니다' : '제품 목록 불러오는 중...'}</option>
                            )}

                            {/* DB 데이터로 옵션 만들기 */}
                            {dbProducts.map((prod) => (
                                <option key={prod.id} value={prod.name}>
                                    {prod.name}
                                </option>
                            ))}
                            <option value="기타">기타 (직접 입력)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-muted)]">
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-black text-[var(--color-body)]">문의 내용 *</label>
                    <textarea name="message" rows={5} required value={formData.message} onChange={handleChange} className="form-field min-h-36 resize-y" placeholder="모델명, 수량, 사용 환경, 필요한 납기 등을 입력해주세요." />
                </div>

                <div className="mb-6">
                    <div className="flex items-start gap-2 mb-2">
                        <input type="checkbox" id="privacy" checked={formData.agreed} onChange={handleCheckbox} className="mt-0.5 w-5 h-5 cursor-pointer" />
                        <label htmlFor="privacy" className="cursor-pointer select-none text-sm font-black leading-relaxed text-[var(--color-ink)]">[필수] 개인정보 수집 및 이용에 동의합니다.</label>
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`button-primary w-full ${isSubmitting ? 'opacity-60' : ''}`}>
                    {isSubmitting ? '전송 중...' : '문의하기'}
                </button>
            </form>
            </div>
        </div>
    );
}

export default function ContactPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ContactContent />
        </Suspense>
    );
}
