import { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/api/public-meta";
import { getSiteUrl } from "@/lib/site-url";

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
