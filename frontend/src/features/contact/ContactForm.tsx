'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FineIcon from '@/components/FineIcon';
import ProductPhoto from '@/components/ProductPhoto';
import { getProducts } from '@/lib/api/products';
import { createInquiry } from '@/lib/api/inquiries';
import { isApiError } from '@/lib/api/client';
import type { Product } from '@/lib/api/types';

export default function ContactForm({ productId, legacyName }: { productId?: string; legacyName?: string }) {
  const [products, setProducts] = useState<Product[]>();
  const [listFailed, setListFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const selected = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let ignore = false;
    void getProducts().then(rows => {
      if (!ignore) { setProducts(rows.filter(row => row.isVisible)); setListFailed(false); }
    }).catch(() => { if (!ignore) setListFailed(true); });
    return () => { ignore = true; };
  }, [attempt]);

  const requested = productId && products?.find(p => String(p.id) === productId);
  const value = selection ?? (requested ? String(requested.id) : legacyName && !productId ? 'legacy' : '');
  const product = products?.find(p => String(p.id) === value);
  const productName = product?.name ?? (value === 'legacy' ? legacyName : value === 'other' ? '기타' : undefined);
  const unavailable = productId && products && !requested && selection === undefined;

  return <div className="site-container py-7 pb-14">
    <p className="site-muted mb-7 text-xs"><Link href="/">홈</Link>　›　<Link href="/products">제품 목록</Link>{product && <>　›　<Link href={`/products/${product.id}`}>{product.name}</Link></>}　›　문의</p>
    <h1 className="fine-title">제품 문의</h1>
    <p className="site-muted mt-4">문의 내용을 남겨주세요. * 표시는 필수 항목입니다.</p>
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {success ? <section className="fine-panel p-6" role="status">
        <h2 className="text-xl font-bold">문의가 접수되었습니다.</h2>
        <p className="site-muted my-4">입력하신 연락처로 답변드리겠습니다.</p>
        <button className="button-secondary" onClick={() => setSuccess(false)}>새 문의 작성</button>
      </section> : <form className="min-w-0 space-y-6" onSubmit={async e => {
        e.preventDefault();
        if (submitting.current) return;
        const fields = new FormData(e.currentTarget);
        const read = (key: string) => String(fields.get(key) ?? '').trim();
        if (read('website')) return;
        if (!read('name') || !read('phone') || !read('message')) { setError('성함, 연락처, 문의 내용을 입력해 주세요.'); return; }
        if (productId && selection === undefined && !product) { setError('제품을 다시 선택하거나 일반 문의를 선택해 주세요.'); selected.current?.focus(); return; }
        submitting.current = true; setBusy(true); setError('');
        try {
          await createInquiry({ name: read('name'), phoneNumber: read('phone'), email: read('email'), company: read('company'), message: read('message'), productName });
          setSuccess(true); setSelection('');
        } catch (cause) {
          if (isApiError(cause) && cause.data?.inquirySaved === true) { setSuccess(true); setSelection(''); }
          else setError(isApiError(cause) && cause.status === 429 ? '문의 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' : isApiError(cause) && cause.status === 400 ? cause.message : '접수 결과를 확인하지 못했습니다. 다시 보내기 전에 전화로 확인해 주세요.');
        } finally { submitting.current = false; setBusy(false); }
      }}>
        <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-xl font-bold">담당자 정보</legend>
          <label className="grid gap-2 text-sm font-semibold">담당자 성함 *<input required className="fine-input" name="name" autoComplete="name" placeholder="성함을 입력해주세요" /></label>
          <label className="grid gap-2 text-sm font-semibold">회사명 / 단체명<input className="fine-input" name="company" autoComplete="organization" placeholder="회사명 또는 단체명 (선택)" /></label>
          <label className="grid gap-2 text-sm font-semibold">연락처 *<input required className="fine-input" name="phone" type="tel" autoComplete="tel" placeholder="연락 가능한 전화번호" /></label>
          <label className="grid gap-2 text-sm font-semibold">이메일 (선택)<input className="fine-input" name="email" type="email" autoComplete="email" placeholder="이메일 주소를 입력해주세요" /></label>
        </fieldset>
        <hr className="border-[var(--color-line)]" />
        <fieldset disabled={busy} className="grid min-w-0 gap-4">
          <legend className="mb-4 text-xl font-bold">문의 내용</legend>
          <label className="grid gap-2 text-sm font-semibold">관심 제품 (선택)
            <select ref={selected} className="fine-input" value={productId && selection === undefined && !product ? 'pending' : value} onChange={e => setSelection(e.target.value)}>
              {productId && !product && selection === undefined && <option value="pending" disabled>{products || listFailed ? '제품을 다시 선택해 주세요' : '제품 확인 중…'}</option>}
              <option value="">일반 문의 (제품 선택 안 함)</option>
              {legacyName && !productId && <option value="legacy">{legacyName}</option>}
              {products?.map(p => <option key={p.id} value={p.id}>{p.name} · {p.category}{p.modelName ? ` · ${p.modelName}` : ''}</option>)}
              <option value="other">기타</option>
            </select>
          </label>
          {listFailed ? <p role="status" className="site-muted">제품 목록을 불러오지 못했습니다. 일반 문의는 가능합니다. <button type="button" className="fine-link" onClick={() => setAttempt(a => a + 1)}>다시 불러오기</button></p> :
            unavailable ? <p role="status" className="site-muted">요청한 제품을 찾을 수 없습니다. 다른 제품 또는 일반 문의를 선택해 주세요.</p> :
            !products && <p role="status" className="site-muted">제품 목록을 불러오는 중입니다.</p>}
          <label className="grid gap-2 text-sm font-semibold">문의 내용 *<textarea required name="message" className="fine-input min-h-36" placeholder="모델명, 수량, 사용 환경, 필요한 납기 등을 입력해주세요." /></label>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><label className="flex items-center gap-2"><input required type="checkbox" className="size-4 accent-[var(--color-blue)]" />[필수] 개인정보 수집 및 이용에 동의합니다.</label><Link className="fine-link" href="/privacy" target="_blank" rel="noopener noreferrer">내용 보기 ↗</Link></div>
          <input name="website" hidden tabIndex={-1} autoComplete="off" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="site-muted">입력 내용과 선택 제품을 확인해주세요.</p><button disabled={busy} className="button-primary gap-2 px-8" type="submit">{busy ? '접수 중…' : '문의하기'} <FineIcon name="ArrowRight" /></button></div>
        </fieldset>
      </form>}
      <aside className="min-w-0 space-y-6">
        {product && !success && <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6">
          <div className="mb-5 flex justify-between text-sm"><h2 className="font-bold">문의할 제품</h2><button onClick={() => selected.current?.focus()} className="fine-link">제품 변경</button></div>
          <div className="flex items-center gap-4"><ProductPhoto url={product.imageUrl} name={product.name} className="h-20 w-24 shrink-0" /><div className="min-w-0"><strong className="break-words text-xl">{product.name}</strong><p className="site-muted">{product.category}</p></div></div>
          <dl className="my-4 text-sm">{[['등록 규격',product.spec],['모델명',product.modelName]].map(([label, text]) => <div key={label} className="grid grid-cols-[110px_1fr] gap-3 border-b border-[var(--color-line)] py-3"><dt>{label}</dt><dd className="break-words">{text || '미등록'}</dd></div>)}</dl>
          <Link className="fine-link text-sm" href={`/products/${product.id}`}>← 제품 상세로 돌아가기</Link>
        </section>}
        <section className="grid gap-2 text-sm">
          <h2 className="font-bold">다른 방법으로 문의</h2><a className="text-2xl font-bold" href="tel:02-2693-3569">02-2693-3569</a>
          <p className="site-muted">팩스 032-232-8823</p><a className="site-muted" href="mailto:kimcw153@gmail.com">이메일 kimcw153@gmail.com</a>
          <p className="site-muted">인천광역시 동구 방축로 37번길 30, 2동 206호</p><Link className="fine-link" href="/about#directions">오시는 길 →</Link>
        </section>
      </aside>
    </div>
  </div>;
}
