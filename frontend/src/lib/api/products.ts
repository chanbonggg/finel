import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
import type { ImageUploadResponse, MessageResponse, Product, ProductCreateRequest, ProductMutationResponse, ProductUpdateRequest } from './types';

export type { Product } from './types';
type ProductsResponse = { success: boolean; products: Product[] };

export async function getProducts(options: { includeHidden?: boolean; categoryId?: number } = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (options.includeHidden) query.set('includeHidden', 'true');
  if (options.categoryId !== undefined) query.set('categoryId', String(options.categoryId));
  const suffix = query.size ? `?${query}` : '';
  return (await readJson<ProductsResponse>(await apiFetch(`/api/products${suffix}`, { cache: 'no-store' }))).products;
}
export async function getProduct(id:number|string):Promise<Product|null>{const response=await apiFetch(`/api/products/${id}`,{cache:'no-store'});if(response.status===404)return null;return (await readJson<{product:Product}>(response)).product;}
export async function getFeaturedProducts(limit=4):Promise<Product[]>{return (await readJson<ProductsResponse>(await apiFetch(`/api/products/featured?limit=${limit}`,{cache:'no-store'}))).products;}
export async function searchProducts(q:string,signal?:AbortSignal):Promise<Product[]>{return (await readJson<ProductsResponse>(await apiFetch(`/api/products/search?q=${encodeURIComponent(q)}`,{cache:'no-store',signal}))).products;}
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
