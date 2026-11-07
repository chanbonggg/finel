'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FineIcon from '@/components/FineIcon';
import { useRouter } from 'next/navigation';
import { getProducts, deleteProduct } from '@/lib/api/products';
import { isApiError } from '@/lib/api/client';
import type { Product } from '@/lib/api/types';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';

export default function ProductTab({ onFormChange }: { onFormChange: (mode: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Product | 'new'>();
  const [deleting, setDeleting] = useState<number>();
  const request = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();

  const showError = useCallback((cause: unknown) => {
    if (isApiError(cause) && cause.status === 401) { router.replace('/chanyoung/login'); return; }
    setError(isApiError(cause) && cause.errorCode === 'CSRF_INVALID' ? '보안 토큰이 갱신되었습니다. 다시 실행해 주세요.' :
      cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.');
  }, [router]);

  const refresh = useCallback(async () => {
    if (request.current) return;
    request.current = true; setLoading(true); setError('');
    try { setProducts(await getProducts({ includeHidden: true })); }
    catch (cause) { showError(cause); }
    finally { request.current = false; setLoading(false); }
  }, [showError]);

  useEffect(() => { void refresh(); }, [refresh]);
  const open = (item: Product | 'new') => { setForm(item); onFormChange(item === 'new' ? '상품 등록' : '상품 수정'); };
  const close = () => { setForm(undefined); onFormChange(''); requestAnimationFrame(() => heading.current?.focus()); };

  if (form) return <ProductForm product={form === 'new' ? undefined : form} products={products} onClose={close} onSaved={saved => {
    setProducts(rows => rows.some(row => row.id === saved.id) ? rows.map(row => row.id === saved.id ? saved : row) : [saved, ...rows]); close();
  }} />;

  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 ref={heading} tabIndex={-1} className="fine-title">상품 관리</h1><p className="site-muted mt-3">등록된 상품 정보, 이미지와 카탈로그를 관리하세요.</p></div>
      <div className="flex flex-wrap gap-2"><button className="button-secondary" disabled={loading || deleting !== undefined} onClick={refresh}>새로고침</button><button className="button-primary gap-2" disabled={loading || deleting !== undefined} onClick={() => open('new')}><FineIcon name="Plus" />상품 등록</button></div></div>
    {error && <div role="alert" className="fine-panel p-4 text-sm text-red-700">{error} <button className="fine-link" onClick={refresh}>다시 불러오기</button></div>}
    {loading && !products.length ? <p role="status">상품을 불러오는 중입니다.</p> :
      (products.length > 0 || !error) && <ProductTable products={products} onEdit={open} deleting={deleting} onDelete={async id => {
        if (request.current || !confirm('상품을 삭제하시겠습니까?')) return;
        request.current = true; setDeleting(id); setError('');
        try { await deleteProduct(id); setProducts(rows => rows.filter(row => row.id !== id)); }
        catch (cause) { showError(cause); }
        finally { request.current = false; setDeleting(undefined); }
      }} />}
  </section>;
}
