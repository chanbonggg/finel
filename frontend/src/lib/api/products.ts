import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
import type { ImageUploadResponse, MessageResponse, Product, ProductCreateRequest, ProductMutationResponse, ProductUpdateRequest } from './types';

export type { Product } from './types';
type ProductsResponse = { success: boolean; products: Product[] };
type ProductResponse = { success: boolean; product: Product };
type ProductListOptions = { includeHidden?: boolean; categoryId?: number };

const PUBLIC_PRODUCTS_CACHE = { revalidate: 300, tags: ['products'] };
const ADMIN_PRODUCTS_INIT = { cache: 'no-store' as const };
const SEARCH_PRODUCTS_INIT = { cache: 'no-store' as const };

// Keep product request construction local so callers only depend on contract-level functions.
function productListPath(options: ProductListOptions): string {
  const query = new URLSearchParams();
  if (options.includeHidden) query.set('includeHidden', 'true');
  if (options.categoryId !== undefined) query.set('categoryId', String(options.categoryId));
  return `/api/products${query.size ? `?${query}` : ''}`;
}

function productListInit(options: ProductListOptions): RequestInit {
  // Authenticated/admin reads must never share a public cache entry.
  return options.includeHidden ? ADMIN_PRODUCTS_INIT : { next: PUBLIC_PRODUCTS_CACHE };
}

function productDetailInit(id: number | string): RequestInit {
  return { next: { revalidate: 300, tags: ['products', `product:${id}`] } };
}

async function readProducts(response: Response): Promise<Product[]> {
  return (await readJson<ProductsResponse>(response)).products;
}

async function readProduct(response: Response): Promise<Product> {
  return (await readJson<ProductResponse>(response)).product;
}

export async function getProducts(options: ProductListOptions = {}): Promise<Product[]> {
  return readProducts(await apiFetch(productListPath(options), productListInit(options)));
}

export async function getProduct(id: number | string): Promise<Product | null> {
  const response = await apiFetch(`/api/products/${id}`, productDetailInit(id));
  if (response.status === 404) return null;
  return readProduct(response);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return readProducts(await apiFetch(`/api/products/featured?limit=${limit}`, { next: PUBLIC_PRODUCTS_CACHE }));
}

export async function searchProducts(q: string, signal?: AbortSignal): Promise<Product[]> {
  return readProducts(await apiFetch(`/api/products/search?q=${encodeURIComponent(q)}`, {
    ...SEARCH_PRODUCTS_INIT,
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
