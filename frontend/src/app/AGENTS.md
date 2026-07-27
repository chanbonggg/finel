# App Router 작업 가이드

## 책임

- route segment에는 페이지 조합, route layout, metadata, loading/error/not-found 처리를 둔다.
- 도메인 상태·복잡한 상호작용은 `src/features`로 옮기고 Spring 호출은 `src/lib/api`만 사용한다.
- `sitemap.ts`, `robots.ts`, `internal/revalidate`는 공개 URL과 캐시 갱신의 경계다.

## 규칙

- 서버 컴포넌트를 기본으로 하고, event handler·browser API가 필요할 때만 client component를 사용한다.
- 동적 제품/카테고리 페이지에서 API의 404는 `notFound()`로 변환한다. 숨김 제품을 metadata나 sitemap에 포함하지 않는다.
- metadata의 canonical/OG URL은 `lib/site-url`과 기존 설정을 사용한다. route handler에 비밀값을 하드코딩하지 않는다.

## 검증

라우팅, metadata, 404 경계를 확인하고 `npm run build`로 prerender를 검증한다.
