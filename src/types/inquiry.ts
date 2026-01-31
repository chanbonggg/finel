export interface Inquiry {
    id: number;
    name: string;
    email: string;
    phone: string;
    company?: string;
    product?: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}
