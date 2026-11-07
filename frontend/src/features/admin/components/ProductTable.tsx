'use client';

import { useState } from 'react';
import FineIcon from '@/components/FineIcon';
import ProductPhoto from '@/components/ProductPhoto';
import type { Product } from '@/lib/api/types';

export default function ProductTable({ products, deleting, onEdit, onDelete }: {
  products: Product[]; deleting?: number; onEdit: (product: Product) => void; onDelete: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(0);
  const [page, setPage] = useState(1);
  const categories = [...new Map(products.map(p => [p.categoryId, p.category])).entries()];
  const list = products.filter(p => (!category || p.categoryId === category) && [p.name,p.modelName].some(text => text?.toLowerCase().includes(query.toLowerCase())))
    .sort((a,b) => a.name.localeCompare(b.name,'ko') || a.id - b.id);
  const pages = Math.max(1, Math.ceil(list.length / 10));
  const current = Math.min(page, pages);
  return <>
    <form className="fine-panel flex flex-wrap items-end gap-4 p-5" onSubmit={e => {
      e.preventDefault(); const data = new FormData(e.currentTarget); setQuery(String(data.get('query')).trim()); setCategory(Number(data.get('category'))); setPage(1);
    }} onReset={() => { setQuery(''); setCategory(0); setPage(1); }}>
      <label className="grid min-w-48 flex-1 gap-1 text-sm font-bold">상품 검색<input className="fine-input font-normal" name="query" placeholder="상품명 또는 모델명 입력" /></label>
      <label className="grid min-w-44 gap-1 text-sm font-bold">제품군<select className="fine-input font-normal" name="category"><option value={0}>전체 제품군</option>{categories.map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <button type="submit" className="button-secondary gap-2 max-sm:w-auto"><FineIcon name="Search" />검색</button><button type="reset" className="site-muted pb-3">초기화</button>
    </form>
    <div className="fine-panel overflow-hidden">
      <div className="flex flex-wrap justify-between gap-2 p-5 text-sm"><h2 className="font-bold">상품 {list.length}개</h2><p className="site-muted">제품명 순</p></div>
      {list.length ? <div className="overflow-x-auto" role="region" aria-label="관리자 상품 표" tabIndex={0}>
        <table className="fine-table min-w-[790px] table-fixed">
          <colgroup>{['10%','20%','14%','15%','13%','13%','15%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
          <thead><tr>{['이미지','상품명','제품군','등록 규격','모델명','카탈로그 PDF','관리'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead>
          <tbody>{list.slice((current - 1)*10,current*10).map(p => <tr key={p.id}><td><ProductPhoto url={p.imageUrl} name={p.name} label="미등록" icon="ImageAdmin" className="h-12 w-14" /></td>
            <th scope="row"><button className="fine-link text-left" onClick={() => onEdit(p)}>{p.name}</button>{!p.isVisible && <span className="ml-2 text-xs font-normal text-gray-600">숨김</span>}</th>
            <td>{p.category}</td><td>{p.spec || '미등록'}</td><td><span className="line-clamp-2-safe" title={p.modelName ?? undefined}>{p.modelName || '미등록'}</span></td><td>{p.catalogFileId ? `등록 · ${p.catalogPage}쪽` : '미등록'}</td>
            <td><div className="flex flex-wrap gap-x-3 gap-y-1"><button className="fine-link flex items-center gap-1 whitespace-nowrap" onClick={() => onEdit(p)}>수정 <FineIcon name="EditArrow" /></button><button disabled={deleting !== undefined} className="whitespace-nowrap text-red-700" onClick={() => onDelete(p.id)}>{deleting === p.id ? '삭제 중…' : '삭제'}</button></div></td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="border-t border-[var(--color-line)] p-8 text-center" role="status">표시할 상품이 없습니다.</p>}
      {pages > 1 && <nav className="flex justify-end gap-3 border-t border-[var(--color-line)] p-4 text-sm" aria-label="관리자 상품 페이지"><button disabled={current === 1} onClick={() => setPage(current - 1)}>‹ 이전</button><span aria-current="page">{current} / {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)}>다음 ›</button></nav>}
    </div>
  </>;
}
