import Link from "next/link";

export default function QuickMenu() {
    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">

            {/* 1. 카카오톡 상담 버튼 (노란색) */}
            <Link
                href="https://open.kakao.com/o/ssQyV5gi" // 나중에 실제 카톡 링크로 변경
                target="_blank"
                className="bg-yellow-400 text-black p-4 rounded-full shadow-lg hover:bg-yellow-500 hover:scale-110 transition flex items-center justify-center w-14 h-14"
                aria-label="카카오톡 상담"
            >
                {/* 말풍선 아이콘 (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
            </Link>

            {/* 2. 전화 상담 버튼 (파란색) */}
            <Link
                href="tel:02-2693-3569"
                className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition flex items-center justify-center w-14 h-14"
                aria-label="전화 상담"
            >
                {/* 전화기 아이콘 (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
            </Link>

        </div>
    );
}
