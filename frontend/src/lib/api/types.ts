export interface ApiErrorBody {
  success?: false;
  errorCode?: string | null;
  stage?: string | null;
  message?: string;
  [key: string]: unknown;
}

export interface MessageResponse {
  success: true;
  message: string;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  companyId: number;
  spec: string;
  description: string;
  imageUrl: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  companyId: number;
}

export interface Inquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  content: string;
  company: string | null;
  product: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ProductCreateRequest {
  name: string;
  categoryId: string;
  spec: string;
  description: string;
  imageUrl: string;
}

export interface ProductUpdateRequest {
  name: string;
  categoryId?: string;
  spec: string;
  description: string;
  imageUrl: string;
  isVisible?: boolean;
}

export interface ProductMutationResponse extends MessageResponse {
  product: Product;
}

export interface ImageUploadResponse {
  success: boolean;
  secureUrl: string;
  publicId: string | null;
}

export interface CategoryCreateRequest {
  name: string;
  companyId: number;
}

export interface CategoryCreateResponse extends MessageResponse {
  category: Category;
}

export interface InquiryCreateRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  message: string;
  productName: string;
  company: string;
}

export interface InquiryCreateResponse {
  success: boolean;
  errorCode: string | null;
  stage: string | null;
  message: string;
  mailSent: boolean | null;
  inquirySaved: boolean | null;
  inquiryId: number | null;
  inquiry: Inquiry | null;
}

export interface CsrfResponse {
  success: boolean;
  token: string;
  headerName: string;
}

export interface LoginResponse extends MessageResponse {
  user: { id: number; username: string } | null;
}

export interface VerifyResponse {
  success: boolean;
  user: { id: number; username: string; iat: number; exp: number };
}

export interface SitemapData {
  success: boolean;
  products: Array<{ id: number; updatedAt: string }>;
  categories: Array<{ id: number }>;
}
