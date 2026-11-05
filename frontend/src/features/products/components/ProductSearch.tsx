'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import FineIcon from '@/components/FineIcon';
import { useDebounce } from '@/hooks/useDebounce';
import { translateSearchQuery } from '@/lib/searchKeywordMap';
import { searchProducts, type Product } from '@/lib/api/products';

export default function ProductSearch({ primary = false }: { primary?: boolean }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<{ query: string; items: Product[]; failed: boolean }>();
  const term = query.trim();
  const debounced = useDebounce(term, 300);
  const router = useRouter();
  const id = useId();

  useEffect(() => {
    if (!debounced) return;
    const controller = new AbortController();
    const alias = translateSearchQuery(debounced);
    const queries = alias.toLowerCase() === debounced.toLowerCase() ? [debounced] : [debounced, alias];
    void Promise.allSettled(queries.map(q => searchProducts(q, controller.signal))).then(([original, translated]) => {
      if (controller.signal.aborted) return;
      const items = [...(original.status === 'fulfilled' ? original.value : []), ...(translated?.status === 'fulfilled' ? translated.value : [])];
      setState({ query: debounced, items: [...new Map(items.map(item => [item.id, item])).values()].slice(0, 10), failed: original.status === 'rejected' });
    });
    return () => controller.abort();
  }, [debounced]);

  const matches = state?.query === term ? state : undefined;
  const items = matches?.items ?? [];
  const visible = open && Boolean(term);
  const go = (url: string) => { setOpen(false); setActive(-1); router.push(url); };

  return (
    <form role="search" className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
      onSubmit={e => { e.preventDefault(); go(items[active] ? `/products/${items[active].id}` : term ? `/products?q=${encodeURIComponent(term)}` : '/products'); }}>
      <div className={`flex items-center gap-3 rounded-md border bg-white px-4 ${primary ? 'min-h-16 border-[var(--color-blue)]' : 'min-h-[46px] border-[var(--color-input)]'}`}>
        <FineIcon name="Search" />
        <input aria-label="제품명 · 모델명 · 용도 검색" role="combobox" aria-autocomplete="list" aria-expanded={visible}
          aria-controls={visible ? id : undefined} aria-activedescendant={visible && items[active] ? `${id}-${active}` : undefined}
          className="min-w-0 flex-1 py-2 text-sm outline-none" type="search" value={query}
          placeholder="제품명 · 모델명 · 용도 검색" onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setActive(-1); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault(); setOpen(true);
              setActive(previous => e.key === 'ArrowDown' ? Math.min(previous + 1, items.length - 1) : Math.max(previous - 1, -1));
            }
          }} />
        {primary && <button className="button-primary button-inline shrink-0" type="submit">검색하기</button>}
      </div>
      {visible && <div className="absolute inset-x-0 top-full z-40 mt-1 rounded-md border border-[var(--color-line)] bg-white p-2 shadow-lg">
        <ul id={id} role="listbox" className="max-h-72 overflow-auto">
          {items.map((item, index) => <li role="option" aria-selected={active === index} id={`${id}-${index}`} key={item.id}
            onMouseDown={e => e.preventDefault()} onClick={() => go(`/products/${item.id}`)}
            className={`cursor-pointer break-words px-3 py-2 hover:bg-[var(--color-paper)] ${active === index ? 'bg-[var(--color-selected)]' : ''}`}>
            <strong>{item.name}</strong> <span className="site-muted">{item.category}</span>
          </li>)}
        </ul>
        {(!matches || matches.failed || !items.length) && <p role="status" className="site-muted px-3 py-2">
          {!matches ? '검색 중…' : matches.failed ? '검색 결과를 모두 불러오지 못했습니다.' : '일치하는 제품이 없습니다.'}
        </p>}
      </div>}
    </form>
  );
}
