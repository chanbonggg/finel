import { apiFetch, isApiConfigurationError, readJson } from './client';
export interface SitemapData { products:{id:number;updatedAt:string}[]; categories:{id:number}[]; }
export async function getSitemapData():Promise<SitemapData>{try{return await readJson<SitemapData>(await apiFetch('/api/sitemap-data',{next:{revalidate:300}}));}catch(error){if(isApiConfigurationError(error))return {products:[],categories:[]};throw error;}}
