import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts().catch(() => []);
  const categories = [...new Map(products.map(({ categoryId, category, companyId }) => [categoryId, { id: categoryId, name: category, companyId }])).values()];
  return <div className="site-shell"><Navbar categories={categories} /><main className="flex-1">{children}</main><Footer /></div>;
}
