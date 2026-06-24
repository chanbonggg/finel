import { apiFetch, isApiConfigurationError, readJson } from './client';
import { authenticatedFetch } from './auth';

export interface Product { id:number; name:string; categoryId:number; category:string; companyId:number; spec:string; description:string; imageUrl:string; isVisible:boolean; createdAt:string; updatedAt:string; }
type ProductsResponse = { success: boolean; products: Product[] };

export async function getProducts(options: { includeHidden?: boolean; categoryId?: number } = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (options.includeHidden) query.set('includeHidden', 'true');
  if (options.categoryId !== undefined) query.set('categoryId', String(options.categoryId));
  const suffix = query.size ? `?${query}` : '';
  return (await readJson<ProductsResponse>(await apiFetch(`/api/products${suffix}`, { cache: 'no-store' }))).products;
}
export async function getProduct(id:number|string):Promise<Product|null>{try{const response=await apiFetch(`/api/products/${id}`,{cache:'no-store'});if(response.status===404)return null;return (await readJson<{product:Product}>(response)).product;}catch(error){if(isApiConfigurationError(error))return null;throw error;}}
export async function getFeaturedProducts(limit=4):Promise<Product[]>{try{return (await readJson<ProductsResponse>(await apiFetch(`/api/products/featured?limit=${limit}`,{next:{revalidate:300}}))).products;}catch(error){if(isApiConfigurationError(error))return [];throw error;}}
export async function searchProducts(q:string,signal?:AbortSignal):Promise<Product[]>{return (await readJson<ProductsResponse>(await apiFetch(`/api/products/search?q=${encodeURIComponent(q)}`,{cache:'no-store',signal}))).products;}
export async function createProduct(body:unknown){return authenticatedFetch('/api/products',{method:'POST',body:JSON.stringify(body)});}
export async function updateProduct(id:number,body:unknown){return authenticatedFetch(`/api/products/${id}`,{method:'PATCH',body:JSON.stringify(body)});}
export async function deleteProduct(id:number){return authenticatedFetch(`/api/products/${id}`,{method:'DELETE'});}
