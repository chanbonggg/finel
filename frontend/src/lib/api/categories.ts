import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
import type { Category, CategoryCreateRequest, CategoryCreateResponse, MessageResponse } from './types';
export type { Category } from './types';
export async function getCategories(companyId:number):Promise<Category[]>{return (await readJson<{categories:Category[]}>(await apiFetch(`/api/categories?companyId=${companyId}`,{cache:'no-store'}))).categories;}
export async function getCategory(id:number|string):Promise<Category|null>{const response=await apiFetch(`/api/categories/${id}`,{cache:'no-store'});if(response.status===404)return null;return (await readJson<{category:Category}>(response)).category;}
export async function createCategory(body: CategoryCreateRequest): Promise<CategoryCreateResponse> {
  return readJson<CategoryCreateResponse>(await authenticatedFetch('/api/categories', { method: 'POST', body: JSON.stringify(body) }));
}
export async function deleteCategory(id: number): Promise<MessageResponse> {
  return readJson<MessageResponse>(await authenticatedFetch(`/api/categories?id=${id}`, { method: 'DELETE' }));
}
