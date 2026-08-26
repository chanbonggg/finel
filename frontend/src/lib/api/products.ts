import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
import type { ImageUploadResponse, MessageResponse, Product, ProductCreateRequest, ProductMutationResponse, ProductUpdateRequest } from './types';

export type { Product } from './types';
type ProductsResponse = { success: boolean; products: Product[] };
type ProductListOptions = { includeHidden?: boolean; categoryId?: number };

const PUBLIC_PRODUCTS_CACHE = { revalidate: 300, tags: ['products'] };

function productListPath(options: ProductListOptions): string {
  const query = new URLSearchParams();
  if (options.includeHidden) query.set('includeHidden', 'true');
  if (options.categoryId !== undefined) query.set('categoryId', String(options.categoryId));
  return `/api/products${query.size ? `?${query}` : ''}`;
}

async function readProducts(response: Response): Promise<Product[]> {
  return (await readJson<ProductsResponse>(response)).products;
}

export async function getProducts(options: ProductListOptions = {}): Promise<Product[]> {
  return readProducts(await apiFetch(
    productListPath(options),
    options.includeHidden ? { cache: 'no-store' } : { next: PUBLIC_PRODUCTS_CACHE },
  ));
}

export async function getProduct(id: number | string): Promise<Product | null> {
  const response = await apiFetch(`/api/products/${id}`, {
    next: { revalidate: 300, tags: ['products', `product:${id}`] },
  });
  if (response.status === 404) return null;
  return (await readJson<{ success: boolean; product: Product }>(response)).product;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return readProducts(await apiFetch(`/api/products/featured?limit=${limit}`, { next: PUBLIC_PRODUCTS_CACHE }));
}

export async function searchProducts(q: string, signal?: AbortSignal): Promise<Product[]> {
  return readProducts(await apiFetch(`/api/products/search?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
    signal,
  }));
}

export async function createProduct(body: ProductCreateRequest): Promise<ProductMutationResponse> {
  return readJson<ProductMutationResponse>(await authenticatedFetch('/api/products', { method: 'POST', body: JSON.stringify(body) }));
}

export async function updateProduct(id: number, body: ProductUpdateRequest): Promise<ProductMutationResponse> {
  return readJson<ProductMutationResponse>(await authenticatedFetch(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
}

export async function deleteProduct(id: number): Promise<MessageResponse> {
  return readJson<MessageResponse>(await authenticatedFetch(`/api/products/${id}`, { method: 'DELETE' }));
}

export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const data = await readJson<ImageUploadResponse>(await authenticatedFetch('/api/uploads/images', { method: 'POST', body }));
  return data.secureUrl;
}
