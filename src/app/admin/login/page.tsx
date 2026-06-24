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
        setIsSubmitting(true);
        try {
            const { response: res, data } = await login(username, password);

            if (res.ok && data.success) {
                router.replace('/admin');
            } else {
                alert(data.message || '로그인 실패');
            }
        } catch {
            alert('서버 오류');
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
