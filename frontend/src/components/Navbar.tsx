import Link from 'next/link';
import ProductSearch from '@/features/products/components/ProductSearch';
import FineIcon from './FineIcon';

export default function Navbar({ categories }: { categories: { id: number; name: string }[] }) {
  return (
    <header className="relative z-30 bg-white text-sm">
      <div className="border-b border-[var(--color-line)]">
        <div className="site-container grid min-h-[86px] grid-cols-[1fr_2fr_1fr] items-center gap-5 py-3 max-md:grid-cols-[1fr_auto] max-md:gap-3">
          <Link href="/" className="inline-flex items-center gap-4 text-[var(--color-black)]">
            <strong className="text-2xl font-black">FineL</strong>
            <span className="site-muted hidden whitespace-nowrap text-xs lg:inline">산업용 공압 부품</span>
          </Link>
          <div className="max-md:order-last max-md:col-span-2"><ProductSearch /></div>
          <nav aria-label="회사 메뉴" className="flex flex-wrap justify-end gap-x-5 gap-y-1 max-sm:gap-x-3">
            <Link href="/about">회사 소개</Link><Link href="/about#directions">오시는 길</Link><Link href="/contact">문의</Link>
          </nav>
        </div>
      </div>
      <nav aria-label="제품 메뉴" className="border-b border-[var(--color-line)]">
        <div className="site-container flex min-h-[49px] items-center gap-5">
          <details className="relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><FineIcon name="Menu" />전체 제품 카테고리</summary>
            <div className="absolute top-full mt-3 grid w-60 gap-1 rounded-md border border-[var(--color-line)] bg-white p-2 shadow">
              <Link className="px-3 py-2" href="/products">전체 제품</Link>
              {categories.map(c => <Link className="break-words px-3 py-2 hover:bg-[var(--color-paper)]" key={c.id} href={`/products/category/${c.id}`}>{c.name}</Link>)}
            </div>
          </details>
          <div className="ml-8 hidden min-w-0 flex-1 items-center gap-6 lg:flex">
            {categories.slice(0, 5).map(c => <Link className="truncate" key={c.id} href={`/products/category/${c.id}`}>{c.name}</Link>)}
          </div>
          <Link className="ml-auto flex shrink-0 items-center gap-2 font-bold" href="/products"><FineIcon name="Columns2" />제품 목록 · 비교</Link>
        </div>
      </nav>
    </header>
  );
}
