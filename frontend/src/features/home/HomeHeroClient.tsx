"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/api/products";

type HomeHeroClientProps = {
  products: Product[];
};

export default function HomeHeroClient({ products }: HomeHeroClientProps) {
  const visibleProducts = useMemo(
    () => products.filter((product) => product.isVisible).slice(0, 5),
    [products],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visibleProducts.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % visibleProducts.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [visibleProducts.length]);

  const product = visibleProducts[index];
  const panel = (
    <div className="surface-card-lg block">
      {product ? (
        <Link href={`/products/${product.id}`} aria-label={`${product.name} 상세 보기`}>
          <div className="relative min-h-[350px] border-b border-[var(--color-line)] bg-gradient-to-b from-white to-[var(--color-pale)]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="product-image-contain transition-opacity duration-300"
                priority
              />
            ) : (
              <div className="grid h-[350px] place-items-center">
                <span className="placeholder-mark">{product.category.slice(0, 2)}</span>
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="relative min-h-[350px] border-b border-[var(--color-line)] bg-gradient-to-b from-white to-[var(--color-pale)]">
          <div className="grid h-[350px] place-items-center">
            <span className="placeholder-mark">FineL</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] items-end gap-4 p-[18px] max-sm:grid-cols-1">
        <div className="min-w-0">
          {product ? (
            <Link
              href={`/products/${product.id}`}
              className="line-clamp-2-safe block text-xl font-black text-[var(--color-ink)] hover:text-[var(--color-blue)]"
            >
              {product.name}
            </Link>
          ) : (
            <strong className="line-clamp-2-safe block text-xl font-black text-[var(--color-ink)]">
              주력 제품 상담
            </strong>
          )}
          <span className="mt-1 block break-keep text-sm leading-relaxed text-[var(--color-muted)]">
            {product
              ? `${product.category} · ${product.spec}`
              : "제품 도입을 위한 전문 상담부터 견적 문의까지 연결합니다."}
          </span>
        </div>
        {visibleProducts.length > 1 && (
          <div className="flex gap-2" aria-label="메인 제품 이미지 선택">
            {visibleProducts.map((item, dotIndex) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setIndex(dotIndex)}
                aria-label={`${item.name} 이미지 보기`}
                className={`h-2 rounded-full transition-all ${
                  dotIndex === index
                    ? "w-6 bg-[var(--color-blue)]"
                    : "w-2 bg-[#b6c1cf]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return panel;
}
