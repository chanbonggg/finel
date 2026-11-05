import { authenticatedFetch } from './auth';
import { publicApiUrl, isApiError, readJson } from './client';
import type { Catalog } from './types';

export const MAX_CATALOG_BYTES = 1_000_000_000;

export function catalogUrl(id: number, page: number) {
  const path = `/api/catalogs/${id}/file`;
  return `${publicApiUrl(path)}#page=${page}`;
}

export async function getCatalog(id: number, signal?: AbortSignal) {
  return (await readJson<{ catalog: Catalog }>(await authenticatedFetch(`/api/catalogs/${id}`, { cache: 'no-store', signal }))).catalog;
}

export async function uploadCatalog(file: File, signal: AbortSignal, progress: (percent: number) => void): Promise<Catalog> {
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size < 1 || file.size > MAX_CATALOG_BYTES) {
    throw new Error('1GB 이하의 비어 있지 않은 PDF 파일을 선택해 주세요.');
  }
  const { upload } = await readJson<{ upload: { uploadId: string; chunkSize: number } }>(
    await authenticatedFetch('/api/uploads/catalogs', { method: 'POST', body: JSON.stringify({ sizeBytes: file.size }) }),
  );
  const path = `/api/uploads/catalogs/${upload.uploadId}`;
  try {
    for (let offset = 0, index = 0; offset < file.size; offset += upload.chunkSize, index++) {
      signal.throwIfAborted();
      const chunk = file.slice(offset, offset + upload.chunkSize);
      // Let an in-flight chunk finish before cancelling its server session.
      await readJson(await authenticatedFetch(`${path}/chunks/${index}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: chunk,
      }));
      progress(Math.floor((offset + chunk.size) * 100 / file.size));
    }
    signal.throwIfAborted();
    return (await readJson<{ catalog: Catalog }>(await authenticatedFetch(`${path}/complete`, { method: 'POST' }))).catalog;
  } catch (error) {
    try {
      const response = await authenticatedFetch(path, { method: 'DELETE' });
      if (response.status !== 404) await readJson(response);
    } catch (cleanupError) {
      if (!isApiError(error) || error.status !== 401) {
        throw new Error('업로드를 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.', { cause: cleanupError });
      }
    }
    throw error;
  }
}
