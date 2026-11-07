import { apiFetch, readJson } from './client';
import { authenticatedFetch } from './auth';
import type { Inquiry, InquiryCreateRequest, InquiryCreateResponse, MessageResponse } from './types';
export type { Inquiry } from './types';
export async function createInquiry(body: InquiryCreateRequest): Promise<InquiryCreateResponse> {
  return readJson<InquiryCreateResponse>(await apiFetch('/api/inquiries', { method: 'POST', body: JSON.stringify(body) }));
}
export async function getInquiries(): Promise<Inquiry[]> {
  return (await readJson<{ success: boolean; inquiries: Inquiry[] }>(await apiFetch('/api/inquiries', { cache: 'no-store' }))).inquiries;
}
export async function deleteInquiry(id: number): Promise<MessageResponse> {
  return readJson<MessageResponse>(await authenticatedFetch(`/api/inquiries/${id}`, { method: 'DELETE' }));
}
export async function markInquiryRead(id: number): Promise<Inquiry> {
  const data = await readJson<MessageResponse & { inquiry: Inquiry }>(await authenticatedFetch(
    `/api/inquiries/${id}/read`, { method: 'PATCH', body: JSON.stringify({ isRead: true }) },
  ));
  return data.inquiry;
}
