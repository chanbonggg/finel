import { apiFetch, isApiConfigurationError, readJson } from './client';
import { authenticatedFetch } from './auth';
export interface Category { id:number; name:string; companyId:number; }
export async function getCategories(companyId:number):Promise<Category[]>{return (await readJson<{categories:Category[]}>(await apiFetch(`/api/categories?companyId=${companyId}`,{cache:'no-store'}))).categories;}
export async function getCategory(id:number|string):Promise<Category|null>{try{const response=await apiFetch(`/api/categories/${id}`,{cache:'no-store'});if(response.status===404)return null;return (await readJson<{category:Category}>(response)).category;}catch(error){if(isApiConfigurationError(error))return null;throw error;}}
export async function createCategory(body:unknown){return authenticatedFetch('/api/categories',{method:'POST',body:JSON.stringify(body)});}
export async function deleteCategory(id:number){return authenticatedFetch(`/api/categories?id=${id}`,{method:'DELETE'});}
