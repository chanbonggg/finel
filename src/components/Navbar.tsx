import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* 로고 영역 */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="FINEL 로고"
            width={150}
            height={60}
            quality={100}
            //className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* 메뉴 링크 영역 */}
        <ul className="flex space-x-6">
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
