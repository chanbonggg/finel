import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* 로고 영역 */}
        <Link href="/" className="text-xl font-bold">
          My Company
        </Link>

        {/* 메뉴 링크 영역 */}
        <ul className="flex space-x-6">
          <li>
            <Link href="/company" className="hover:text-gray-300">회사소개</Link>
          </li>
          <li>
            <Link href="/products" className="hover:text-gray-300">제품소개</Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-gray-300">문의하기</Link>
          </li>
          <li>
            <Link href="/admin" className="text-red-400 hover:text-red-300">관리자</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
