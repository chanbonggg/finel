import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
export async function createInquiry(body:unknown){return apiFetch('/api/inquiries',{method:'POST',body:JSON.stringify(body)});}
export async function getInquiries<T>():Promise<T[]>{return (await readJson<{inquiries:T[]}>(await apiFetch('/api/inquiries',{cache:'no-store'}))).inquiries;}
export async function deleteInquiry(id:number){return authenticatedFetch(`/api/inquiries/${id}`,{method:'DELETE'});}
