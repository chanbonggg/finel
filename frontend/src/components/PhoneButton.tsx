'use client';

import { useState } from 'react';

const PHONE = '02-2693-3569';

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

export default function PhoneButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const [open, setOpen] = useState(false);
    const padding = size === 'sm' ? 'py-3 px-8' : 'py-4 px-10';

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={`button-primary ${padding} flex items-center gap-2`}
            >
                <PhoneIcon />
                전화 문의
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-8 w-80 text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center mb-4">
                            <div className="bg-[var(--color-pale)] p-4 rounded-full text-[var(--color-blue)]">
                                <PhoneIcon />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">전화 문의</p>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{PHONE}</p>
                        <p className="text-gray-500 text-sm mb-6">전화로 연결하시겠습니까?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition"
                            >
                                취소
                            </button>
                            <a
                                href={`tel:${PHONE}`}
                                className="button-primary flex-1"
                                onClick={() => setOpen(false)}
                            >
                                전화 연결
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
