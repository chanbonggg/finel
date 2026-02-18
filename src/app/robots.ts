import { MetadataRoute } from 'next';

/**
 * 검색 엔진 크롤러에게 사이트의 어떤 페이지를 수집하고 어떤 페이지를 무시할지 알려주는 파일입니다.
 * https://nextjs.org/docs/app/api-reference/file-conventions/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // 모든 검색 엔진에 적용
      allow: '/',     // 사이트 전체를 기본적으로 허용
      disallow: ['/admin/', '/api/'], // 관리자 페이지와 API 경로는 수집 제외
    },
    sitemap: 'https://www.finel.co.kr/sitemap.xml', // 사이트맵 주소
  };
}