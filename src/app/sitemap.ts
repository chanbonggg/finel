import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes = ["/", "/about", "/products", "/contact", "/privacy"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const products = await prisma.product.findMany({
    where: { isVisible: true },
    select: { id: true, updatedAt: true },
  });

  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
  }));

  const categories = await prisma.category.findMany({
    select: { id: true },
  });

  const categoryRoutes = categories.map((cat) => ({
    url: `${siteUrl}/products/category/${cat.id}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
