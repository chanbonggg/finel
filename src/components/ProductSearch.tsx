'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';
import { translateSearchQuery } from '@/lib/searchKeywordMap';

interface SearchResult {
    id: number;
    name: string;
    imageUrl: string;
    category: string;
}

export default function ProductSearch() {
    // --- 상태 관리 ---
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // --- 검색 API 호출 ---
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const translatedQuery = translateSearchQuery(debouncedQuery);

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(translatedQuery)}`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    console.error('검색 API 오류:', res.status);
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setResults(data.products);
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error('검색 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
        return () => controller.abort();
    }, [debouncedQuery]);

    // --- 바깥 클릭 감지 ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Escape 키로 닫기 ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // --- 입력창 열기 시 포커스 ---
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // --- 이벤트 핸들러 ---
    const handleToggle = () => {
        if (isOpen) {
            setIsOpen(false);
            setQuery('');
            setResults([]);
        } else {
            setIsOpen(true);
        }
    };

    const handleSelect = (productId: number) => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        router.push(`/products/${productId}`);
    };

    const showDropdown = isOpen && debouncedQuery.trim().length > 0;

    return (
        <div ref={containerRef} className="relative flex items-center">
            {/* 검색 입력창 */}
            {isOpen && (
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="제품 검색..."
                    className="w-36 md:w-48 px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm
                               border border-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                               outline-none transition placeholder-gray-400 mr-2"
                />
            )}

            {/* 돋보기 아이콘 버튼 */}
            <button
                onClick={handleToggle}
                className="p-1.5 rounded-lg hover:bg-gray-700 transition"
                aria-label="제품 검색"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-300 hover:text-white transition"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </button>

            {/* 검색 결과 드롭다운 */}
            {showDropdown && (
                <div className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-white rounded-xl shadow-lg
                                border border-gray-200 z-50 overflow-hidden">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            검색 중...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-80 overflow-y-auto">
                            {results.map((product) => (
                                <li key={product.id}>
                                    <button
                                        onClick={() => handleSelect(product.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50
                                                   transition text-left border-b border-gray-100 last:border-b-0"
                                    >
                                        {/* 썸네일 */}
                                        {product.imageUrl ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0
                                                            flex items-center justify-center">
                                                <svg
                                                    className="w-5 h-5 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        {/* 제품 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {product.category}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                            검색 결과가 없습니다
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
