import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// 라벨과 입력 필드를 감싸는 래퍼
export function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

// 공통 스타일이 적용된 Input
export function AdminInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition ${className}`}
            {...props}
        />
    );
}

// 공통 스타일이 적용된 Select
export function AdminSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={`w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition bg-white ${className}`}
            {...props}
        />
    );
}

// 공통 스타일이 적용된 Textarea
export function AdminTextarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={`w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition resize-none ${className}`}
            {...props}
        />
    );
}
