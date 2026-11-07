'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { PARTNERS } from '@/constants/partners';
import type { Category } from '@/lib/api/types';
import FineIcon from './FineIcon';

export default function CategoryMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const companies = [...new Set(categories.map(category => category.companyId))].sort((a, b) => a - b).map(id => ({
    id, name: PARTNERS.find(partner => partner.id === id)?.name.toUpperCase() ?? `기업 ${id}`,
  }));

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      opener.current?.focus();
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [open]);

  return <div ref={root} className="relative flex min-w-0 items-center gap-8">
    <button type="button" aria-expanded={open} aria-controls={panelId}
      className="flex shrink-0 items-center gap-2 font-bold" onClick={event => {
        opener.current = event.currentTarget;
        setOpen(!open);
      }}><FineIcon name="Menu" />기업별 제품</button>
    {open && <div id={panelId} className="absolute left-0 top-full z-10 mt-3 grid max-h-[65vh] w-60 gap-1 overflow-y-auto rounded-md border border-[var(--color-line)] bg-white p-2 shadow">
      <Link className="px-3 py-2" href="/products" onClick={() => setOpen(false)}>전체 제품</Link>
      {companies.map(company => <Link key={company.id}
        className="rounded px-3 py-2 font-semibold hover:bg-[var(--color-paper)]"
        href={`/products?companyId=${company.id}`} onClick={() => setOpen(false)}>{company.name}</Link>)}
      {!companies.length && <p className="site-muted px-3 py-2">등록된 기업이 없습니다.</p>}
    </div>}
    <div className="hidden min-w-0 items-center gap-6 lg:flex">
      {companies.slice(0, 5).map(company => <Link key={company.id} className="truncate"
        href={`/products?companyId=${company.id}`} onClick={() => setOpen(false)}>{company.name}</Link>)}
    </div>
  </div>;
}
