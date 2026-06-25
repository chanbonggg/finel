'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api/auth';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return;
        setIsSubmitting(true);
        try {
            const data = await login(username.trim(), password);
            if (data.success !== true) throw new Error(data.message || '로그인에 실패했습니다.');
            router.replace('/chanyoung');
        } catch (error) {
            const value = error as Error & { status?: number; errorCode?: string; data?: { message?: string; errorCode?: string } };
            const status = value.status;
            const code = value.errorCode ?? value.data?.errorCode;
            if (status === 400) alert(value.data?.message || '아이디와 비밀번호를 확인해 주세요.');
            else if (status === 401) alert('아이디 또는 비밀번호가 올바르지 않습니다.');
            else if (status === 403 && code === 'CSRF_INVALID') alert('보안 토큰이 만료되었습니다. 다시 로그인해 주세요.');
            else if (status === 403) alert('로그인 요청이 거부되었습니다.');
            else if (status === 429) alert('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.');
            else alert(value.data?.message || value.message || '서버에 연결할 수 없습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-10 rounded-xl shadow-lg w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">관리자 접속</h1>
                <div className="mb-4">
                    <label htmlFor="username-input" className="sr-only">아이디</label>
                    <input
                        id="username-input"
                        type="text"
                        placeholder="아이디 (ID)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border p-3 rounded"
                        required
                        autoComplete="username"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password-input" className="sr-only">비밀번호</label>
                    <input
                        id="password-input"
                        type="password"
                        placeholder="비밀번호 (Password)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-3 rounded"
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white p-3 rounded font-bold transition ${isSubmitting ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-700'}`}
                >
                    {isSubmitting ? '확인 중...' : '로그인'}
                </button>
            </form>
        </div>
    );
}
