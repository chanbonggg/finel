'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { PARTNERS } from '@/constants/partners';
import type { Category } from '@/lib/api/types';
import FineIcon from './FineIcon';

export default function CategoryMenu({ categories }: { categories: Category[] }) {
  const [selection, setSelection] = useState<number | 'all' | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const open = selection !== null;
  const groups = new Map<number, Category[]>();
  for (const category of categories) {
    const group = groups.get(category.companyId);
    if (group) group.push(category);
    else groups.set(category.companyId, [category]);
  }
  const companies = [...groups.keys()].sort((a, b) => a - b).map(id => ({
    id, name: PARTNERS.find(partner => partner.id === id)?.name.toUpperCase() ?? `기업 ${id}`,
  }));

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setSelection(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelection(null);
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
        setSelection(open ? null : 'all');
      }}><FineIcon name="Menu" />전체 제품 카테고리</button>
    {open && <div id={panelId} className="absolute left-0 top-full z-10 mt-3 grid max-h-[65vh] w-60 gap-1 overflow-y-auto rounded-md border border-[var(--color-line)] bg-white p-2 shadow">
      <Link className="px-3 py-2" href="/products" onClick={() => setSelection(null)}>전체 제품</Link>
      {companies.map(company => <div key={company.id}>
        <button type="button" aria-expanded={selection === company.id}
          className="flex w-full justify-between rounded px-3 py-2 text-left font-semibold hover:bg-[var(--color-paper)]"
          onClick={() => setSelection(selection === company.id ? 'all' : company.id)}>
          {company.name}<span aria-hidden="true">{selection === company.id ? '−' : '+'}</span>
        </button>
        {selection === company.id && <ul className="ml-3 border-l border-[var(--color-line)]">
          {groups.get(company.id)?.map(category => <li key={category.id}>
            <Link className="block break-words px-3 py-2 hover:bg-[var(--color-paper)]"
              href={`/products/category/${category.id}`} onClick={() => setSelection(null)}>{category.name}</Link>
          </li>)}
        </ul>}
      </div>)}
      {!companies.length && <p className="site-muted px-3 py-2">등록된 제품군이 없습니다.</p>}
    </div>}
    <div className="hidden min-w-0 items-center gap-6 lg:flex">
      {companies.slice(0, 5).map(company => <button key={company.id} type="button"
        aria-expanded={selection === company.id} aria-controls={panelId} className="truncate"
        onClick={event => {
          opener.current = event.currentTarget;
          setSelection(selection === company.id ? null : company.id);
        }}>{company.name}</button>)}
    </div>
  </div>;
}
