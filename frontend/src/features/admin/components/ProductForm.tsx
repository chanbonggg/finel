'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PARTNERS } from '@/constants/partners';
import FineIcon from '@/components/FineIcon';
import ProductPhoto from '@/components/ProductPhoto';
import { getCategories, createCategory, deleteCategory } from '@/lib/api/categories';
import { catalogUrl, getCatalog, uploadCatalog } from '@/lib/api/catalogs';
import { isApiError } from '@/lib/api/client';
import { createProduct, updateProduct, uploadProductImage } from '@/lib/api/products';
import type { Catalog, Category, Product, Specification } from '@/lib/api/types';
import CategoryManager from './CategoryManager';

const emptyRow: Specification = { name: '', value: '' };

export default function ProductForm({ product, products, onClose, onSaved }: {
  product?: Product; products: Product[]; onClose: () => void; onSaved: (p: Product) => void;
}) {
  const [initial] = useState(() => ({
    companyId: product?.companyId ?? 0, categoryId: String(product?.categoryId ?? ''),
    name: product?.name ?? '', modelName: product?.modelName ?? '', spec: product?.spec ?? '',
    useCase: product?.useCase ?? '', description: product?.description ?? '', imageUrl: product?.imageUrl ?? '',
    specifications: product?.specifications?.length ? product.specifications : [emptyRow],
    catalogFileId: product?.catalogFileId ?? null, catalogPage: String(product?.catalogPage ?? ''),
    isVisible: product?.isVisible ?? true,
  }));
  const [form, setForm] = useState(initial);
  const [categoryResult, setCategoryResult] = useState<{ company: number; items: Category[]; failed?: boolean }>();
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [manage, setManage] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [catalogs, setCatalogs] = useState<Record<number, Catalog>>({});
  const [catalogError, setCatalogError] = useState<number>();
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [busy, setBusy] = useState<'save' | 'image' | 'pdf' | 'category'>();
  const [progress, setProgress] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const controller = useRef<AbortController>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const categories = categoryResult?.company === form.companyId ? categoryResult.items : [];
  const selectedCatalog = form.catalogFileId ? catalogs[form.catalogFileId] : undefined;
  const catalogFailed = Boolean(form.catalogFileId && catalogError === form.catalogFileId);
  const availableFiles = [...new Map(products.filter(p => p.catalogFileId).map(p => [p.catalogFileId!, p.name])).entries()];
  const page = /^\d+$/.test(form.catalogPage) ? Number(form.catalogPage) : 0;
  const validPage = Boolean(selectedCatalog && page > 0 && page <= selectedCatalog.pageCount);

  useEffect(() => {
    if (!form.companyId) return;
    let active = true;
    const company = form.companyId;
    void getCategories(company).then(items => { if (active) setCategoryResult({ company, items }); })
      .catch(() => { if (active) setCategoryResult({ company, items: [], failed: true }); });
    return () => { active = false; };
  }, [form.companyId, categoryAttempt]);

  useEffect(() => {
    const id = form.catalogFileId;
    if (!id || selectedCatalog) return;
    const request = new AbortController();
    void getCatalog(id, request.signal).then(catalog => {
      if (!request.signal.aborted) setCatalogs(previous => ({ ...previous, [id]: catalog }));
    }).catch(() => { if (!request.signal.aborted) setCatalogError(id); });
    return () => request.abort();
  }, [form.catalogFileId, selectedCatalog, catalogAttempt]);

  useEffect(() => {
    if (!dirty && !busy) return;
    const prevent = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty, busy]);

  useEffect(() => () => controller.current?.abort(), []);

  function field<K extends keyof typeof initial>(key: K, value: typeof initial[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function run(action: NonNullable<typeof busy>, operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(action); setError('');
    try { await operation(); }
    catch (cause) {
      if (isApiError(cause) && cause.status === 401) { router.replace('/chanyoung/login'); return; }
      showError(isApiError(cause) && cause.errorCode === 'CSRF_INVALID' ? '보안 토큰이 갱신되었습니다. 다시 시도해 주세요.' :
        cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.');
    } finally { locked.current = false; setBusy(undefined); }
  }

  const close = () => { if (!locked.current && (!dirty || confirm('저장하지 않은 변경사항을 버리시겠습니까?'))) onClose(); };
  const save = () => {
    const specifications = form.specifications.map(row => ({ name: row.name.trim(), value: row.value.trim() })).filter(row => row.name || row.value);
    const unchangedLink = form.catalogFileId === initial.catalogFileId && form.catalogPage === initial.catalogPage;
    if (!form.name.trim() || !form.categoryId || !categories.some(c => String(c.id) === form.categoryId)) return showError('상품명과 유효한 제품군을 입력해 주세요.');
    if (specifications.some(row => !row.name || !row.value)) return showError('상세 규격의 항목명과 값을 모두 입력해 주세요.');
    if (new Set(specifications.map(row => row.name)).size !== specifications.length) return showError('상세 규격의 항목명은 중복될 수 없습니다.');
    if (form.catalogFileId && !validPage && !unchangedLink) return showError('PDF의 실제 페이지 범위 안에서 시작 페이지를 입력해 주세요.');
    return run('save', async () => {
      const payload = {
        name: form.name.trim(), categoryId: form.categoryId, spec: form.spec.trim(),
        modelName: form.modelName.trim() || null, useCase: form.useCase.trim() || null,
        description: form.description, imageUrl: form.imageUrl, specifications,
        ...(product && unchangedLink ? {} : { catalogFileId: form.catalogFileId, catalogPage: form.catalogFileId ? page : null }),
      };
      const result = product ? await updateProduct(product.id, { ...payload, isVisible: form.isVisible }) : await createProduct(payload);
      onSaved(result.product);
    });
  };

  const chooseImage = (file?: File) => {
    if (!file) return;
    void run('image', async () => {
      if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error('5 MiB 이하의 JPEG, PNG, WebP 또는 GIF를 선택해 주세요.');
      field('imageUrl', await uploadProductImage(file));
    });
  };
  const choosePdf = (file?: File) => {
    if (!file) return;
    void run('pdf', async () => {
      const task = new AbortController(); controller.current = task;
      setProgress(0); setCancelling(false);
      try {
        const catalog = await uploadCatalog(file, task.signal, setProgress);
        setCatalogs(previous => ({ ...previous, [catalog.id]: catalog }));
        setForm(previous => ({ ...previous, catalogFileId: catalog.id, catalogPage: '1' }));
      } catch (cause) { if (!(task.signal.aborted && cause instanceof DOMException && cause.name === 'AbortError')) throw cause; }
      finally { controller.current = null; }
    });
  };

  return <form className="space-y-5" onSubmit={e => { e.preventDefault(); void save(); }}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="fine-title">{product ? '상품 수정' : '상품 등록'}</h1><p className="site-muted mt-3">상품의 기본 정보와 규격, 이미지와 카탈로그를 관리하세요.</p></div>
      <button type="button" className="button-secondary gap-2" disabled={Boolean(busy)} onClick={close}><FineIcon name="ArrowLeft" />목록으로</button></div>
    <div className="site-muted flex justify-between"><span>* 필수 항목 · 그 외 항목은 선택 입력입니다.</span>{product && !dirty && <span>변경사항 없음</span>}</div>
    <fieldset disabled={Boolean(busy)} className="fine-panel min-w-0 space-y-4 p-5 md:p-6">
      <h2 className="text-xl font-bold">상품 기본정보</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">상품명 *<input className="fine-input" required placeholder="상품명을 입력하세요" value={form.name} onChange={e => field('name',e.target.value)} /></label>
        <label className="grid gap-2 text-sm font-semibold">브랜드<select className="fine-input" value={form.companyId} onChange={e => {
          setForm(previous => ({ ...previous, companyId: Number(e.target.value), categoryId: '' })); setManage(false); setCategoryResult(undefined);
        }}><option value={0}>브랜드 선택</option>{PARTNERS.map(p => <option value={p.id} key={p.id}>{p.name.toUpperCase()}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">모델명<input className="fine-input" maxLength={200} value={form.modelName} placeholder="모델명을 입력하세요" onChange={e => field('modelName',e.target.value)} /></label>
        <div className="grid gap-2"><span className="text-sm font-semibold">제품군 *</span>
          {!form.companyId ? <p className="site-muted">브랜드를 선택하면 제품군이 표시됩니다.</p> :
          categoryResult?.company !== form.companyId ? <p role="status">제품군을 불러오는 중…</p> :
          categoryResult.failed ? <p role="alert">제품군을 불러오지 못했습니다. <button type="button" className="fine-link" onClick={() => setCategoryAttempt(a => a + 1)}>다시 시도</button></p> :
          <CategoryManager categories={categories} selectedCategoryId={form.categoryId} onSelectCategory={id => field('categoryId',id)}
            isAdding={manage} onToggleAdding={setManage} newCategoryName={categoryName} onNewCategoryNameChange={setCategoryName}
            onAdd={() => {
              if (!categoryName.trim()) return showError('제품군 이름을 입력해 주세요.');
              void run('category', async () => {
                const result = await createCategory({ name: categoryName.trim(), companyId: form.companyId });
                setCategoryResult({ company: form.companyId, items: [...categories, result.category] }); field('categoryId',String(result.category.id)); setCategoryName(''); setManage(false);
              });
            }} onDelete={id => { if (confirm('이 제품군을 삭제하시겠습니까?')) void run('category', async () => {
              await deleteCategory(id); setCategoryResult({ company: form.companyId, items: categories.filter(c => c.id !== id) });
              if (form.categoryId === String(id)) field('categoryId','');
            }); }} />}
        </div>
      </div>
      {product && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isVisible} onChange={e => field('isVisible',e.target.checked)} />공개 상품으로 표시</label>}
    </fieldset>
    <fieldset disabled={Boolean(busy)} className="fine-panel min-w-0 space-y-4 p-5 md:p-6">
      <h2 className="text-xl font-bold">규격 및 용도</h2>
      <label className="grid gap-2 text-sm font-semibold">등록 규격<input className="fine-input" value={form.spec} onChange={e => field('spec',e.target.value)} placeholder="목록에 표시할 규격을 입력하세요" /></label>
      <div className="space-y-2"><p className="text-sm font-semibold">상세 규격</p>
        {form.specifications.map((row,index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 rounded bg-[var(--color-paper)] p-2">
          <label className="grid gap-1 text-sm">항목명<input aria-label={`규격 ${index+1} 항목명`} className="fine-input" maxLength={100} value={row.name} onChange={e => field('specifications',form.specifications.map((r,i) => i === index ? { ...r,name:e.target.value } : r))} /></label>
          <label className="grid gap-1 text-sm">값<input aria-label={`규격 ${index+1} 값`} className="fine-input" maxLength={500} value={row.value} onChange={e => field('specifications',form.specifications.map((r,i) => i === index ? { ...r,value:e.target.value } : r))} /></label>
          <button type="button" className="button-secondary max-sm:w-auto" aria-label={`규격 ${index+1} 삭제`} onClick={() => field('specifications',form.specifications.filter((_,i) => i !== index))}>−</button>
        </div>)}
        <button type="button" className="button-secondary gap-1" disabled={form.specifications.length >= 50} onClick={() => field('specifications',[...form.specifications,emptyRow])}><FineIcon name="PlusDark" />규격 행 추가</button>
      </div>
      <label className="grid gap-2 text-sm font-semibold">용도<textarea className="fine-input" rows={2} maxLength={10000} value={form.useCase} onChange={e => field('useCase',e.target.value)} placeholder="주요 용도를 입력하세요" /></label>
      <label className="grid gap-2 text-sm font-semibold">상품 설명<textarea className="fine-input" rows={4} value={form.description} onChange={e => field('description',e.target.value)} placeholder="제품 특징과 설명을 입력하세요" /></label>
    </fieldset>
    <fieldset disabled={Boolean(busy)} className="fine-panel min-w-0 space-y-4 p-5 md:p-6">
      <div><h2 className="text-xl font-bold">상품 이미지</h2><p className="site-muted mt-1">상품 목록과 상세에 표시할 대표 이미지입니다.</p></div>
      <div className="flex flex-wrap items-center gap-4" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); chooseImage(e.dataTransfer.files[0]); }}>
        <ProductPhoto url={form.imageUrl} name={form.name || '상품 미리보기'} label="대표 이미지 미등록" icon="ImageForm" className="h-28 w-32" />
        <input ref={imageInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => { chooseImage(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="flex flex-wrap gap-2"><button type="button" className="button-secondary gap-2" onClick={() => imageInput.current?.click()}><FineIcon name="Upload" />{busy === 'image' ? '이미지 업로드 중…' : form.imageUrl ? '이미지 교체' : '이미지 업로드'}</button>
          {form.imageUrl && <button type="button" className="button-secondary" onClick={() => field('imageUrl','')}>삭제</button>}</div>
      </div>
    </fieldset>
    <section className="fine-panel space-y-4 p-5 md:p-6">
      <div><h2 className="text-xl font-bold">카탈로그 PDF</h2><p className="site-muted mt-1">파일을 공유하거나 새 PDF를 연결하고 이 상품의 시작 페이지를 지정하세요.</p></div>
      <fieldset disabled={Boolean(busy)} className="grid min-w-0 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] p-4"
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choosePdf(e.dataTransfer.files[0]); }}>
          <p className="flex items-center gap-2 text-sm"><FineIcon name="FileText" />{form.catalogFileId ? `카탈로그 #${form.catalogFileId}${selectedCatalog ? ` · ${selectedCatalog.pageCount}쪽` : ''}` : '등록된 PDF가 없습니다.'}</p>
          <div className="flex flex-wrap gap-2">
            <input ref={pdfInput} hidden type="file" accept=".pdf,application/pdf" onChange={e => { choosePdf(e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" className="button-secondary gap-2" onClick={() => pdfInput.current?.click()}><FineIcon name="Upload" />{form.catalogFileId ? 'PDF 교체' : 'PDF 업로드'}</button>
            {form.catalogFileId && <button type="button" className="button-secondary" onClick={() => setForm(prev => ({ ...prev,catalogFileId:null,catalogPage:'' }))}>연결 해제</button>}
          </div>
        </div>
        {availableFiles.length > 0 && <label className="grid gap-2 text-sm font-semibold">기존 카탈로그 선택<select className="fine-input" value={availableFiles.some(([id]) => id === form.catalogFileId) ? form.catalogFileId! : ''} onChange={e => {
          if (e.target.value) setForm(previous => ({ ...previous,catalogFileId:Number(e.target.value),catalogPage:'1' }));
        }}><option value="">공유할 카탈로그를 선택하세요</option>{availableFiles.map(([id,label]) => <option key={id} value={id}>#{id} · {label}</option>)}</select></label>}
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-2 text-sm font-semibold">연결할 PDF 페이지<input className="fine-input max-w-48" type="number" min={1} max={selectedCatalog?.pageCount} disabled={!form.catalogFileId} value={form.catalogPage} onChange={e => field('catalogPage',e.target.value)} /></label>
          <p className="site-muted flex-1">PDF 문서의 실제 페이지 순서입니다.</p>
          {validPage && <a className="button-secondary gap-2" href={catalogUrl(form.catalogFileId!,page)} target="_blank" rel="noopener noreferrer"><FineIcon name="ExternalLink1" />카탈로그 PDF 보기</a>}
        </div>
        {catalogFailed && <p role="alert" className="site-muted">PDF 정보를 불러오지 못했습니다. <button type="button" className="fine-link" onClick={() => { setCatalogError(undefined); setCatalogAttempt(a => a + 1); }}>다시 시도</button></p>}
      </fieldset>
      {busy === 'pdf' && <div className="flex flex-wrap items-center gap-3" role="status">
        <progress aria-label="PDF 업로드 진행률" value={progress} max={100} /><span className="text-sm">{cancelling ? '업로드 정리 중…' : progress === 100 ? 'PDF 검증 중…' : `업로드 ${progress}%`}</span>
        {progress < 100 && <button className="button-secondary" type="button" disabled={cancelling} onClick={() => { setCancelling(true); controller.current?.abort(); }}>업로드 취소</button>}
      </div>}
    </section>
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="fine-panel p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-line)] pt-4">
      <button type="button" className="button-secondary" disabled={Boolean(busy)} onClick={close}>취소</button>
      <button type="submit" className="button-primary" disabled={Boolean(busy) || Boolean(product && !dirty)}>{busy === 'save' ? '저장 중…' : product ? '변경사항 저장' : '상품 등록'}</button>
    </div>
  </form>;
}
