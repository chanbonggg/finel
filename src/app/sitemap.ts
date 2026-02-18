import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO: 웹사이트 배포 후 실제 도메인 주소로 반드시 변경해주세요.
  const baseUrl = "https://www.finel.co.kr"; 

  // 1. 고정된 페이지 (홈, 제품 목록, 문의 등)
  const staticRoutes = [
    '/',
    '/products',
    '/contact',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // 2. DB에서 모든 제품 정보를 가져와 동적 페이지 목록 생성
  const products = await prisma.product.findMany({
    where: { isVisible: true },
    select: { id: true, updatedAt: true },
  });

  const productRoutes = products.map(product => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
