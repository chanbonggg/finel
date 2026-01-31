'use client';

import { useState, useEffect } from 'react';
import InquiryTab from '@/app/admin/InquiryTap' // 분리한 컴포넌트 가져오기
import ProductTab from '@/app/admin/ProductTap'; // 분리한 컴포넌트 가져오기

export default function AdminPage() {
    // --- 상태 관리 ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("inquiry");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // 1. 초기 로그인 체크
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setIsLoggedIn(false);
                setIsCheckingAuth(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/verify', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsLoggedIn(res.ok);
                if (!res.ok) localStorage.removeItem('adminToken');
            } catch {
                setIsLoggedIn(false);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, []);

    // 2. 로그인 처리
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('adminToken', data.token);
                setIsLoggedIn(true);
            } else {
                alert(data.message || "로그인 실패");
            }
        } catch (error) {
            alert("서버 오류");
        }
    };

    // 3. 로그아웃
    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
        setPassword("");
    };

    // --- (1) 로그인 화면 ---
    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-gray-500">인증 확인 중...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <form onSubmit={handleLogin} className="bg-white p-10 rounded-xl shadow-lg w-96">
                    <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">관리자 접속</h1>

                    <input
                        type="text" placeholder="아이디 (ID)" value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border p-3 rounded mb-4"
                    />
                    <input
                        type="password" placeholder="비밀번호 (Password)" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-3 rounded mb-4"
                    />
                    <button type="submit" className="w-full bg-gray-900 text-white p-3 rounded font-bold hover:bg-gray-700">
                        로그인
                    </button>
                </form>
            </div>
        );
    }

    // --- (2) 대시보드 화면 ---
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* 상단 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">관리자님 환영합니다 </span>
                        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">로그아웃</button>
                    </div>
                </div>

                {/* 탭 버튼 */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("inquiry")}
                        className={`px-6 py-2 rounded-lg font-bold ${activeTab === "inquiry" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                    >
                        문의 내역
                    </button>
                    <button
                        onClick={() => setActiveTab("product")}
                        className={`px-6 py-2 rounded-lg font-bold ${activeTab === "product" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                    >
                        제품 관리
                    </button>
                </div>

                {/* 탭 내용 보여주기 (조건부 렌더링) */}
                {activeTab === "inquiry" && <InquiryTab />}
                {activeTab === "product" && <ProductTab />}
            </div>
        </div>
    );
}
