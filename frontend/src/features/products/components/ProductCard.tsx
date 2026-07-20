import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api/products";

type ProductCardProps = {
  product: Product;
  categoryLabel?: string;
};

export default function ProductCard({ product, categoryLabel }: ProductCardProps) {
  const label = categoryLabel || product.category;

  return (
    <Link
      href={`/products/${product.id}`}
      className="surface-card group flex min-w-0 flex-col"
    >
      <div className="product-image-panel relative h-[220px] min-h-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="product-image-contain"
          />
        ) : (
          <span className="placeholder-mark">{label.slice(0, 2)}</span>
        )}
        <span className="absolute left-4 top-4 max-w-[calc(100%-32px)] rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[var(--color-body)]">
          <span className="line-clamp-2-safe">{label}</span>
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <div className="mb-2 text-sm font-black uppercase text-[var(--color-blue-dark)]">
          <span className="line-clamp-2-safe">Spec: {product.spec}</span>
        </div>
        <h2 className="line-clamp-2-safe text-xl font-black text-[var(--color-ink)] transition group-hover:text-[var(--color-blue)]">
          {product.name}
        </h2>
        {product.description && (
          <p className="line-clamp-2-safe mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {product.description}
          </p>
        )}
      </div>
    </Link>
  );
}
