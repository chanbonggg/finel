import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-500 py-12 mt-20 text-sm">
            <div className="container mx-auto px-4 text-center">

                {/* 1. 핵심 메뉴 (개인정보처리방침은 법적 필수라 남김) */}
                <div className="flex justify-center gap-6 mb-6 font-medium text-gray-700">
                    {/* 문의 폼이 있으므로 개인정보처리방침은 있는 게 좋습니다 */}
                    <Link href="/privacy" className="hover:text-black">개인정보처리방침</Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/about" className="hover:text-black">오시는 길</Link>


                </div>

                {/* 2. 회사 정보 (한 줄로 깔끔하게 or 두 줄로 정리) */}
                <div className="leading-7 mb-6">
                    <p>
                        <span className="font-bold">Finel</span>
                        <span className="mx-2 text-gray-300">|</span>
                        대표: 김치완
                        <span className="mx-2 text-gray-300">|</span>
                        사업자등록번호: 395-08-02241
                    </p>
                    <p>
                        인천광역시 동구 방축로 37번길 30, 2-206
                        <span className="mx-2 text-gray-300">|</span>
                        Tel: 02-2693-3569
                        <span className="mx-2 text-gray-300">|</span>
                        Email: kimcw153@gmail.com
                    </p>
                </div>

                {/* 3. 저작권 표시 */}
                <p className="text-gray-400 text-xs">
                    Copyright © 2025 Finel. All rights reserved.
                </p>

            </div>
        </footer>
    );
}