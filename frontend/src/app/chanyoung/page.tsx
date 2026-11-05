'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FineIcon from '@/components/FineIcon';
import InquiryTab from '@/features/admin/components/InquiryTap';
import ProductTab from '@/features/admin/components/ProductTap';
import { logout } from '@/lib/api/auth';

export default function AdminPage() {
  const [tab, setTab] = useState<'products' | 'inquiries'>('products');
  const [editing, setEditing] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const locked = useRef(false);
  const router = useRouter();

  return <div className="grid min-h-screen grid-cols-[216px_minmax(0,1fr)] max-md:grid-cols-1">
    <aside className="border-r border-[var(--color-line)] bg-white max-md:border-r-0">
      <div className="flex h-[72px] items-center gap-3 border-b border-[var(--color-line)] px-6"><strong className="text-2xl font-black">FineL</strong><span className="site-muted">관리자</span></div>
      <nav aria-label="관리자 메뉴" className="flex gap-2 p-4 md:grid">
        <p className="site-muted hidden text-xs md:block">사이트 관리</p>
        <button aria-current={tab === 'products' ? 'page' : undefined} onClick={() => setTab('products')} className={`flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold ${tab === 'products' ? 'bg-[var(--color-selected)] text-[var(--color-blue)]' : ''}`}><FineIcon name="Package" />상품 관리</button>
        <button disabled={Boolean(editing)} aria-current={tab === 'inquiries' ? 'page' : undefined} onClick={() => setTab('inquiries')} className={`flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold ${tab === 'inquiries' ? 'bg-[var(--color-selected)] text-[var(--color-blue)]' : ''}`}><FineIcon name="Mail" />문의 메일</button>
      </nav>
      <p className="site-muted mx-6 mt-10 hidden text-xs md:block">산업용 공압 부품<br/>상품 정보 · 제품 문의 관리</p>
    </aside>
    <main className="min-w-0 bg-[var(--color-paper)]">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] bg-white px-5 text-sm md:px-9">
        <p className="site-muted">관리자 / {tab === 'products' ? '상품 관리' : '문의 메일'}{editing && ` / ${editing}`}</p>
        <div className="flex items-center gap-4"><Link className="flex items-center gap-1" href="/" target="_blank" rel="noopener noreferrer">사이트 보기 <FineIcon name="ExternalLink" /></Link>
          <button disabled={loggingOut || Boolean(editing)} className="site-muted" onClick={async () => {
            if (locked.current) return;
            locked.current = true; setLoggingOut(true);
            try { await logout(); router.replace('/chanyoung/login'); }
            catch { alert('로그아웃에 실패했습니다. 다시 시도해 주세요.'); }
            finally { locked.current = false; setLoggingOut(false); }
          }}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button></div>
      </header>
      <div className="p-5 md:p-9">{tab === 'products' ? <ProductTab onFormChange={setEditing} /> : <InquiryTab />}</div>
    </main>
  </div>;
}
