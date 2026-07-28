import { getProducts, type Product } from '@/lib/api/products';
import { isApiConfigurationError } from '@/lib/api/client';
import ProductsClient from '@/features/products/ProductsClient';

// The backend service DNS name exists at container runtime, not image-build time.
export const dynamic = 'force-dynamic';

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
