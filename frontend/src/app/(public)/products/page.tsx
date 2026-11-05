import { getProducts, type Product } from '@/lib/api/products';
import { isApiConfigurationError } from '@/lib/api/client';
import ProductsClient from '@/features/products/ProductsClient';
import type { Metadata } from 'next';

// The backend service DNS name exists at container runtime, not image-build time.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
    const filters = await searchParams;
    return ['q', 'companyId', 'categoryId', 'spec', 'sort', 'page'].some(key => filters[key] !== undefined)
        ? { robots: { index: false, follow: true } }
        : {};
}

export default async function ProductsPage() {
    let products: Product[] = [];
    try {
        products = await getProducts();
    } catch (error) {
        // Keep builds independent from a locally unavailable Spring server.
        if (!isApiConfigurationError(error)) throw error;
    }

    return <ProductsClient initialProducts={products} />;
}
