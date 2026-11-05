# Products Route 작업 가이드

- 목록, 상세, 카테고리 route는 공개 visible 제품만 표시한다. hidden 제품을 cookie 존재 여부로 노출하지 않는다.
- 목록 필터는 제품 응답의 `category`·`companyId`를 사용하며 파라미터 없는 category API 호출을 추가하지 않는다.
- 상세·카테고리 SSR과 metadata는 server API client를 사용하고 API 404를 `notFound()`로 변환한다.
- 검색/필터 같은 클라이언트 상호작용은 `features/products`에 둔다.
- 검증: 목록, 상세, category 404, metadata, hidden 제외, `npm run build`.
