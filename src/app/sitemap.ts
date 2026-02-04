import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO: 웹사이트 배포 후 실제 도메인 주소로 반드시 변경해주세요.
  const baseUrl = "https://www.your-finel-site.com"; 

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

  // 3. DB에서 모든 카테고리 정보를 가져와 동적 페이지 목록 생성
  const categories = await prisma.category.findMany({
    // Category 모델에 updatedAt 필드가 없으므로 select에서 제외합니다.
    select: { name: true },
  });

  const categoryRoutes = categories.map(category => ({
    // URL에 한글이 들어갈 경우를 대비해 인코딩합니다.
    url: `${baseUrl}/category/${encodeURIComponent(category.name)}`,
    // updatedAt 정보가 없으므로 현재 시간으로 설정합니다.
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}