# Spring API 전환 기록

- 제품 목록, 상세 metadata/화면, 카테고리 metadata/화면을 Spring API로 전환했다.
- 목록의 카테고리 필터는 제품 응답의 category/companyId를 조합해 무파라미터 category 호출을 제거했다.
- 상세와 카테고리 SSR은 서버 API base URL을 사용하며 404를 Next.js notFound로 변환한다.
- 검증: SSR metadata, 공개 hidden 제외, lint/build 대상이다.
