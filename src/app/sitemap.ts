import { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/api/public-meta";
import { getSiteUrl } from "@/lib/site-url";

// API 설정과 연결 상태는 빌드 시 빈 sitemap으로 숨기지 않고 요청 시 검증한다.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes = ["/", "/about", "/products", "/contact", "/privacy"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const { products, categories } = await getSitemapData();

  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/products/${product.id}`,
    lastModified: new Date(product.updatedAt),
  }));

  const categoryRoutes = categories.map((cat) => ({
    url: `${siteUrl}/products/category/${cat.id}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
