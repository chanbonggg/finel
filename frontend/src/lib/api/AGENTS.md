# Spring API Client 작업 가이드

## 책임

- `client.ts`는 base URL, credentials, JSON 처리, 오류 정규화, CSRF lifecycle을 소유한다.
- `auth`, `products`, `categories`, `inquiries`, `public-meta`는 API 계약별 함수와 타입만 제공한다.

## 고정 규칙

- 브라우저는 `NEXT_PUBLIC_API_BASE_URL`, 서버는 `SERVER_API_BASE_URL` 우선으로 호출한다. 서버 base URL 누락은 상대 URL로 묵살하지 않고 설정 오류로 다룬다.
- 모든 요청은 credentials를 포함한다. JSON body에만 `Content-Type: application/json`을 설정하며 업로드 `FormData`에는 직접 content type을 지정하지 않는다.
- 로그인과 관리자 mutation은 메모리의 CSRF token을 `X-XSRF-TOKEN`으로 보낸다. API 호출부에서 CSRF/cookie 로직을 복제하지 않는다.
- API 실패는 status, errorCode, 응답 메시지를 보존해 caller가 401/403/404/409/429를 구분할 수 있게 한다.
- prerender의 설정 오류 fallback은 home=빈 featured, product/category=404, sitemap=정적 URL이라는 기존 정책을 유지한다.

## 변경 시 확인

`docs/api-contract.md`, 호출 feature, SSR 소비자와 함께 갱신하고 lint/build 및 credentials·CSRF 흐름을 확인한다.
