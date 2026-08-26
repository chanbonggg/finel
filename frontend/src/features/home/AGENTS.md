# Home Feature 작업 가이드

`features/home`은 홈 화면 전용 인터랙션을 소유한다. featured 제품의 서버 데이터·fallback과 SEO metadata는 `app/page.tsx`와 API client의 정책을 따른다.

- UI 효과는 hydration mismatch 없이 동작해야 하며, DOM 접근·animation listener는 cleanup한다.
- 제품 데이터가 비어도 홈 화면이 깨지지 않게 empty state를 유지한다.
