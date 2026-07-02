import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-[var(--color-line)] bg-white py-10 text-sm text-[var(--color-muted)]">
            <div className="site-container">
                <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 font-bold text-[var(--color-body)]">
                    <Link href="/privacy" className="hover:text-[var(--color-ink)]">개인정보처리방침</Link>
                    <Link href="/about" className="hover:text-[var(--color-ink)]">오시는 길</Link>
                    <Link href="/contact" className="hover:text-[var(--color-ink)]">문의하기</Link>
                </div>

                <div className="mb-6 grid gap-2 leading-7">
                    <p className="break-keep">
                        <span className="font-bold">Finel</span>
                        <span className="mx-2 text-[var(--color-line)]">|</span>
                        대표: 김치완
                        <span className="mx-2 text-[var(--color-line)]">|</span>
                        사업자등록번호: 395-08-02241
                    </p>
                    <p className="break-keep">
                        인천광역시 동구 방축로 37번길 30, 2-206
                        <span className="mx-2 text-[var(--color-line)]">|</span>
                        Tel: 02-2693-3569
                        <span className="mx-2 text-[var(--color-line)]">|</span>
                        Email: kimcw153@gmail.com
                    </p>
                </div>

                <p className="text-xs text-[var(--color-muted)]">
                    Copyright © 2025 Finel. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
