import Link from 'next/link';
import ProductSearch from '@/components/ProductSearch';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* 로고 영역 */}
       <Link href="/" className="text-2xl font-sans font-bold">
        FL FineL
      </Link>


        {/* 메뉴 링크 영역 */}
        <ul className="flex items-center space-x-6">
          <li>
            <ProductSearch />
          </li>
          <li>
            <Link href="/about" className="hover:text-gray-300">회사소개</Link>
          </li>
          <li>
            <Link href="/products" className="hover:text-gray-300">제품소개</Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-gray-300">문의하기</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
