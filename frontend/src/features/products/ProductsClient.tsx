'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { PARTNERS } from '@/constants/partners';
import ProductPhoto from '@/components/ProductPhoto';
import { translateSearchQuery } from '@/lib/searchKeywordMap';
import type { Product } from '@/lib/api/types';

const PAGE_SIZE = 10;
const sortNames = ['latest', 'nameAsc', 'nameDesc'];
const fold = (value: string) => value.toLocaleLowerCase('ko');
const number = (value: string | null) => value && /^\d+$/.test(value) && Number.isSafeInteger(+value) && +value > 0 ? +value : 0;

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const read = (key: string) => params.getAll(key).length === 1 ? params.get(key) : null;
  const q = read('q')?.trim() ?? '';
  const category = number(read('categoryId'));
  const company = number(read('companyId'));
  const spec = read('spec') ?? '';
  const sortParam = read('sort');
  const sort = sortParam && sortNames.includes(sortParam) ? sortParam : 'latest';
  const products = initialProducts.filter(p => p.isVisible);
  const terms = [fold(q), fold(translateSearchQuery(q))].filter(Boolean);
  const base = products.filter(p =>
    (!company || p.companyId === company) && fold(p.spec ?? '').includes(fold(spec)) &&
    (!terms.length || terms.some(term => [p.name, p.modelName, p.useCase].some(field => field && fold(field).includes(term)))),
  );
  const counts = new Map<number, number>();
  for (const product of base) counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  const categories = [...new Map(products.map(p => [p.categoryId, { id: p.categoryId, name: p.category }])).values()];
  const list = base.filter(p => !category || p.categoryId === category).sort((a,b) =>
    (sort === 'latest' ? b.createdAt.localeCompare(a.createdAt) : a.name.localeCompare(b.name, 'ko') * (sort === 'nameDesc' ? -1 : 1)) || b.id - a.id);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(number(read('page')) || 1, pages);
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const href = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, companyId: company, categoryId: category, spec, sort: sort === 'latest' ? '' : sort, page: page === 1 ? 0 : page, ...changes })) {
      if (value) next.set(key, String(value));
    }
    return `${pathname}${next.size ? '?' + next : ''}`;
  };
  const update = (changes: Record<string, string | number | null>) => window.history.pushState(null, '', href(changes));

  return <div className="site-container py-7 pb-12">
    <p className="site-muted mb-6 text-xs"><Link href="/">홈</Link>　›　제품 목록</p>
    <h1 className="fine-title">제품 목록</h1>
    <p className="site-muted mt-3">제품군과 등록 규격으로 필요한 제품을 찾아보세요.</p>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside aria-label="제품 필터" className="min-w-0 space-y-5">
        <div>
          <h2 className="mb-2 font-bold">제품 카테고리</h2>
          <nav className="flex flex-wrap gap-1 lg:grid" aria-label="카테고리 필터">
            <Link aria-current={!category ? 'page' : undefined} className={`flex justify-between gap-3 rounded px-3 py-2 text-sm ${!category ? 'bg-[var(--color-selected)] font-bold text-[var(--color-blue)]' : ''}`} href={href({ categoryId: null, page: null })} scroll={false}>전체 제품 <span>{base.length}</span></Link>
            {categories.map(c => <Link key={c.id} scroll={false} aria-current={category === c.id ? 'page' : undefined} href={href({ categoryId: c.id, page: null })} className={`flex justify-between gap-3 rounded px-3 py-2 text-sm ${category === c.id ? 'bg-[var(--color-selected)] font-bold text-[var(--color-blue)]' : ''}`}>{c.name} <span>{counts.get(c.id) ?? 0}</span></Link>)}
          </nav>
        </div>
        <form key={`${company}:${spec}`} className="grid gap-3 border-t border-[var(--color-line)] pt-4" onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          update({ companyId: Number(data.get('brand')), spec: String(data.get('spec')).trim(), page: null });
        }}>
          <div className="flex justify-between"><h2 className="font-bold">상세 필터</h2><button type="reset" className="site-muted" onClick={() => update({ companyId: null, spec: null, page: null })}>초기화</button></div>
          <label className="grid gap-1 text-sm">브랜드<select className="fine-input" name="brand" defaultValue={company}><option value={0}>전체 브랜드</option>{PARTNERS.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}</select></label>
          <label className="grid gap-1 text-sm">등록 규격<input className="fine-input" name="spec" defaultValue={spec} placeholder="예: 220V" /></label>
          <button className="button-secondary" type="submit">필터 적용</button>
        </form>
      </aside>
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold">전체 제품 {list.length}개</h2>
            <p className="site-muted mt-1">{q ? `검색어: ${q}` : '검색어 없음'} {q && <Link className="fine-link" href={href({ q: null, page: null })} scroll={false}>지우기</Link>} · {categories.find(c => c.id === category)?.name ?? '전체 카테고리'}</p></div>
          <select aria-label="제품 정렬" className="fine-input max-w-36" value={sort} onChange={e => update({ sort: e.target.value === 'latest' ? null : e.target.value, page: null })}>
            <option value="latest">최신순</option><option value="nameAsc">제품명 오름차순</option><option value="nameDesc">제품명 내림차순</option>
          </select>
        </div>
        {visible.length ? <div className="fine-panel overflow-x-auto" tabIndex={0} role="region" aria-label="제품 표">
          <table className="fine-table min-w-[700px] table-fixed">
            <colgroup>{['15%', '21%', '16%', '17%', '16%', '15%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead><tr>{['이미지','제품명','제품군','등록 규격','모델명','상세 정보'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead>
            <tbody>{visible.map(product => <tr key={product.id}>
              <td><ProductPhoto url={product.imageUrl} name={product.name} className="h-14 w-18" /></td>
              <th scope="row" className="font-bold">{product.name}</th><td>{product.category}</td><td>{product.spec || '미등록'}</td><td><span className="line-clamp-2-safe" title={product.modelName ?? undefined}>{product.modelName || '미등록'}</span></td>
              <td><Link className="fine-link" href={`/products/${product.id}`}>상세 보기 →</Link></td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="fine-panel p-8 text-center" role="status">조건에 맞는 제품이 없습니다.</p>}
        {pages > 1 && <nav className="flex flex-wrap items-center justify-center gap-3 text-sm" aria-label="제품 페이지">
          {page > 1 && <Link href={href({ page: page - 1 })} scroll={false}>‹ 이전</Link>}
          <span aria-current="page" className="rounded bg-[var(--color-blue)] px-3 py-1 text-white">{page}</span>
          {page < pages && <Link href={href({ page: page + 1 })} scroll={false}>다음 ›</Link>}
          <span className="site-muted">{page} / {pages} 페이지</span>
        </nav>}
      </section>
    </div>
  </div>;
}
