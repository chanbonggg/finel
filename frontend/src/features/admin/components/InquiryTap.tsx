'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FineIcon from '@/components/FineIcon';
import { deleteInquiry, getInquiries, markInquiryRead } from '@/lib/api/inquiries';
import { isApiError } from '@/lib/api/client';
import type { Inquiry } from '@/lib/api/types';

const date = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

export default function InquiryTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [active, setActive] = useState<number>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<number>();
  const reads = useRef(new Set<number>());
  const request = useRef(false);
  const router = useRouter();

  const message = useCallback((cause: unknown) => {
    if (isApiError(cause) && cause.status === 401) { router.replace('/chanyoung/login'); return '다시 로그인해 주세요.'; }
    if (isApiError(cause) && cause.errorCode === 'CSRF_INVALID') return '보안 토큰이 갱신되었습니다. 다시 시도해 주세요.';
    return cause instanceof Error ? cause.message : '문의를 처리하지 못했습니다.';
  }, [router]);

  const refresh = useCallback(async () => {
    if (request.current) return;
    request.current = true; setLoading(true); setError('');
    try {
      const rows = await getInquiries();
      setInquiries(current => {
        const alreadyRead = new Set(current.filter(i => i.isRead).map(i => i.id));
        return rows.map(i => alreadyRead.has(i.id) ? { ...i, isRead: true } : i);
      });
    } catch (cause) { setError(message(cause)); }
    finally { request.current = false; setLoading(false); }
  }, [message]);

  useEffect(() => { void refresh(); }, [refresh]);
  const rows = inquiries.filter(i => (filter === 'all' || i.isRead === (filter === 'read')) &&
    [i.name,i.company,i.product,i.content].some(value => value?.toLowerCase().includes(query.toLowerCase())));
  const detail = inquiries.find(i => i.id === active);
  const unread = inquiries.filter(i => !i.isRead).length;

  async function open(inquiry: Inquiry) {
    setActive(inquiry.id);
    if (inquiry.isRead || reads.current.has(inquiry.id)) return;
    reads.current.add(inquiry.id);
    setReadError(previous => ({ ...previous, [inquiry.id]: '' }));
    try {
      const updated = await markInquiryRead(inquiry.id);
      setInquiries(items => items.map(row => row.id === updated.id ? { ...row, isRead: updated.isRead } : row));
    } catch (cause) { setReadError(previous => ({ ...previous, [inquiry.id]: message(cause) })); }
    finally { reads.current.delete(inquiry.id); }
  }

  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h1 className="fine-title">문의 메일</h1><p className="site-muted mt-3">사이트 제품 문의 양식으로 접수된 내용을 확인하세요.</p></div>
      <button className="button-secondary max-sm:w-auto" onClick={refresh} disabled={loading}>{loading ? '불러오는 중…' : '새로고침'}</button></div>
    <form className="fine-panel flex flex-wrap items-end gap-4 p-5" onSubmit={e => {
      e.preventDefault(); const data = new FormData(e.currentTarget); setQuery(String(data.get('query')).trim()); setFilter(String(data.get('filter')));
    }}>
      <label className="grid min-w-48 flex-1 gap-1 text-sm font-bold">문의 검색<input className="fine-input font-normal" name="query" placeholder="담당자명, 회사명, 제품명 또는 문의 내용" /></label>
      <label className="grid min-w-40 gap-1 text-sm font-bold">읽음 상태<select className="fine-input font-normal" name="filter"><option value="all">전체</option><option value="unread">안 읽음</option><option value="read">읽음</option></select></label>
      <button type="submit" className="button-secondary gap-2 max-sm:w-auto"><FineIcon name="Search" />검색</button>
    </form>
    {error && <p role="alert" className="fine-panel p-4 text-sm text-red-700">{error}</p>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(230px,1fr)_minmax(0,2.15fr)]">
      <section className="fine-panel min-w-0 overflow-hidden">
        <div className="flex justify-between gap-2 p-4 text-sm"><h2 className="font-bold">받은 문의 {inquiries.length}</h2><p className="fine-link">안 읽음 {unread}</p></div>
        {rows.length > 0 ? <ul className="max-h-[640px] overflow-auto border-t border-[var(--color-line)]">
          {rows.map(i => <li key={i.id} className="border-b border-[var(--color-line)] last:border-0">
            <button aria-pressed={active === i.id} className={`grid w-full gap-1 border-l-2 p-4 text-left text-sm ${active === i.id ? 'border-[var(--color-blue)] bg-[var(--color-selected)]' : 'border-transparent hover:bg-[var(--color-paper)]'}`} onClick={() => open(i)}>
              <span className="flex flex-wrap items-center justify-between gap-1"><strong className="flex items-center gap-2 break-words">{!i.isRead && <FineIcon name="UnreadIndicator" />}{i.name}{i.company && ` · ${i.company}`}</strong><time className="site-muted text-xs" dateTime={i.createdAt}>{date(i.createdAt)}</time></span>
              <span className="line-clamp-2-safe break-words">{i.product || '일반 문의'} · {i.content}</span>
              <span className="site-muted break-all text-xs">{i.email || '이메일 미입력'} · {i.isRead ? '읽음' : '안 읽음'}</span>
            </button>
          </li>)}
        </ul> : <p className="site-muted border-t border-[var(--color-line)] p-5">{loading ? '문의를 불러오는 중…' : error ? '문의를 불러오지 못했습니다.' : '표시할 문의가 없습니다.'}</p>}
      </section>
      <section className="fine-panel min-w-0 p-6">
        {detail ? <>
          <p className="fine-link mb-3 text-xs">{detail.isRead ? '읽음' : '안 읽음'}</p>
          <h2 className="break-words text-2xl font-bold">{detail.product || '일반 문의'}</h2>
          <p className="site-muted mt-2">접수 일시 {date(detail.createdAt)}</p>
          {readError[detail.id] && <p role="alert" className="mt-3 text-sm text-red-700">{readError[detail.id]} <button className="fine-link" onClick={() => open(detail)}>읽음 처리 다시 시도</button></p>}
          <dl className="my-5 grid grid-cols-1 gap-4 border-y border-[var(--color-line)] py-5 text-sm sm:grid-cols-2">
            {[['담당자 성함',detail.name],['회사명 / 단체명',detail.company],['연락처',detail.phone],['이메일',detail.email]].map(([label,value]) => <div key={label}><dt className="site-muted mb-1 text-xs">{label}</dt><dd className="break-words">{value || '미입력'}</dd></div>)}
          </dl>
          {detail.product && <div className="mb-5 rounded bg-[var(--color-paper)] p-4"><p className="site-muted text-xs">접수된 제품명</p><p className="mt-1 break-words font-bold">{detail.product}</p></div>}
          <h3 className="mb-3 font-bold">문의 내용</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{detail.content}</p>
          <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-line)] pt-5">
            {detail.email && <a className="button-secondary gap-2" href={`mailto:${encodeURIComponent(detail.email)}`}><FineIcon name="ExternalLink" />메일로 답변</a>}
            <button className="button-secondary text-red-700" disabled={loading || deleting !== undefined} onClick={async () => {
              if (request.current || !confirm('이 문의를 삭제하시겠습니까?')) return;
              request.current = true; setDeleting(detail.id); setError('');
              try { await deleteInquiry(detail.id); setInquiries(items => items.filter(i => i.id !== detail.id)); setActive(value => value === detail.id ? undefined : value); }
              catch (cause) { setError(message(cause)); }
              finally { request.current = false; setDeleting(undefined); }
            }}>{deleting === detail.id ? '삭제 중…' : '문의 삭제'}</button>
          </div>
        </> : <p className="site-muted p-5 text-center">목록에서 문의를 선택하세요.</p>}
      </section>
    </div>
  </section>;
}
