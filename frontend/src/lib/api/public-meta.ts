import { apiFetch, readJson } from './client';
import type { SitemapData } from './types';
export type { SitemapData } from './types';
export async function getSitemapData():Promise<SitemapData>{return readJson<SitemapData>(await apiFetch('/api/sitemap-data',{next:{revalidate:300}}));}
