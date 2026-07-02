import Link from 'next/link';
import ProductSearch from '@/components/ProductSearch';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-[var(--color-black)] text-white">
      <div className="site-container flex min-h-[58px] items-center justify-between gap-5">
        <Link href="/" className="shrink-0 text-[19px] font-black tracking-normal">
          FineL Pneumatics
        </Link>

        <ul className="flex min-w-0 items-center gap-3 text-sm text-white/75 md:gap-6">
          <li>
            <ProductSearch />
          </li>
          <li className="hidden sm:block">
            <Link href="/products" className="hover:text-white">제품</Link>
          </li>
          <li className="hidden sm:block">
            <Link href="/about" className="hover:text-white">회사 소개</Link>
          </li>
          <li className="hidden sm:block">
            <Link href="/contact" className="hover:text-white">문의</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
