# Frontend API Migration Spec

작성일: 2026-05-31

## 목표

Next.js 화면과 훅에서 호출하던 상대 경로 `/api/...` 요청을 Spring Boot API 호출로 전환한다.

이번 단계에서 해결하려는 문제는 프론트 화면은 유지하면서 서버 기능만 Spring Boot로 분리하는 것이다. 최종 사용자는 제품 조회, 문의 등록, 관리자 기능을 기존과 같은 화면에서 사용하되, 실제 데이터 처리는 Spring Boot API가 담당해야 한다.

## 범위

이번에 할 일:

```text
NEXT_PUBLIC_API_BASE_URL 도입
src/lib/api/client.ts 생성
도메인별 API client 생성
공개 API fetch 경로 전환
관리자 API fetch 경로 전환
credentials: 'include' 적용 기준 통일
관리자 제품 목록을 includeHidden=true로 전환
```

이번에 하지 않을 일:

```text
Next.js API Route 삭제
Prisma 의존성 제거
화면 리디자인
React 상태관리 라이브러리 도입
Cloudinary 업로드 API 이전
```

다음 단계로 넘길 일:

```text
Next.js의 직접 Prisma 사용 제거
src/app/api 제거
배포 환경 CORS/Cookie 최종 검증
```

## 현재 상태

상대 경로 API 호출 사용처:

```text
src/hooks/useInquiry.ts
src/hooks/useProductAdmin.ts
src/components/ProductSearch.tsx
src/app/admin/login/page.tsx
src/app/admin/page.tsx
src/app/products/page.tsx
src/app/contact/page.tsx
```

현재 API Route:

```text
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
src/app/api/auth/verify/route.ts
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
src/app/api/products/search/route.ts
src/app/api/categories/route.ts
src/app/api/inquiries/route.ts
src/app/api/inquiries/[id]/route.ts
```

기존 문제:

```text
관리자 제품 목록과 공개 제품 목록이 모두 GET /api/products를 사용한다.
Spring 계약에서는 공개 목록은 visible만, 관리자 목록은 includeHidden=true로 분리한다.
cross-origin 호출 시 credentials 누락이면 관리자 쿠키가 전송되지 않는다.
```

## 목표 구조

프론트 API 클라이언트 구조:

```text
src/lib/api/
├─ client.ts
├─ auth.ts
├─ products.ts
├─ categories.ts
└─ inquiries.ts
```

기본 원칙:

```text
컴포넌트와 훅은 fetch를 직접 호출하지 않고 도메인 API client를 사용한다.
API base URL 조립은 client.ts 한 곳에서만 한다.
관리자 API는 credentials: 'include'를 반드시 사용한다.
공개 API도 인증 쿠키가 있어도 깨지지 않도록 credentials: 'include' 기본값을 유지한다.
```

## 환경 변수

프론트 필수 환경 변수:

```text
NEXT_PUBLIC_API_BASE_URL
```

로컬:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

same-origin 프록시를 쓰는 경우:

```text
NEXT_PUBLIC_API_BASE_URL=
```

주의:

```text
NEXT_PUBLIC_API_BASE_URL은 브라우저에 노출된다.
JWT_SECRET, DB_URL, MAIL_PASSWORD 같은 민감정보를 NEXT_PUBLIC_*로 만들지 않는다.
```

## 공통 API Client

`src/lib/api/client.ts` 기준:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
let csrfToken: string | null = null;

export function clearCsrfToken() {
  csrfToken = null;
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('CSRF token 발급 실패');
  const data = await response.json();
  csrfToken = data.token;
  return csrfToken;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  const csrfRequired = !['GET', 'HEAD', 'OPTIONS'].includes(method)
    && path !== '/api/inquiries';

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (csrfRequired) {
    headers.set('X-XSRF-TOKEN', await getCsrfToken());
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 403) csrfToken = null;
  return response;
}
```

CSRF 실패 처리:

```text
403 + errorCode=CSRF_INVALID이면 메모리의 csrfToken을 비운다.
로그인 성공과 로그아웃 성공 후에도 기존 token을 비운다. Spring Security는 인증 성공 시 CSRF token을 교체할 수 있다.
상태 변경 요청은 중복 생성/삭제 위험 때문에 자동 재시도하지 않는다.
사용자에게 세션/보안 토큰 갱신 안내 후 해당 작업을 다시 실행하게 한다.
로그인 화면은 submit 전에 GET /api/auth/csrf가 성공해야 한다.
```

파일 업로드 예외:

```text
Cloudinary 직접 업로드는 Spring API가 아니므로 apiFetch를 사용하지 않는다.
multipart/form-data 또는 외부 API 호출은 Content-Type 자동 설정을 방해하지 않도록 별도 함수로 둔다.
GET/HEAD 요청에는 기본 Content-Type을 붙이지 않는다.
JSON body가 있는 요청에만 Content-Type: application/json을 붙인다.
```

## 도메인별 전환 규칙

### Auth

현재:

```text
src/app/admin/login/page.tsx → fetch('/api/auth/login')
src/app/admin/page.tsx → fetch('/api/auth/logout')
```

전환:

```text
POST /api/auth/login
GET /api/auth/logout
GET /api/auth/verify
GET /api/auth/csrf
```

주의:

```text
logout은 POST가 아니라 GET 유지
로그인/로그아웃/verify/csrf 모두 credentials: 'include'
로그인은 X-XSRF-TOKEN 필수
```

### Admin Page Guard

결정:

```text
Spring 인증 전환 후 /admin 보호는 Next.js가 JWT를 직접 검증하지 않는다.
src/proxy.ts는 auth_token 쿠키를 Spring GET /api/auth/verify로 전달해 200/401만 판단한다.
src/lib/admin-auth.ts의 jose/JWT_SECRET 기반 검증은 Spring 인증 전환 후 제거 대상이다.
```

구현 세부:

```text
proxy는 원 요청의 Cookie 헤더를 SERVER_API_BASE_URL/api/auth/verify로 그대로 전달한다.
verify 응답은 status code만 사용한다.
200이면 접근 허용.
401/403/5xx/네트워크 오류/timeout은 모두 접근 실패로 본다.
접근 실패 시 /admin/login으로 redirect하고 auth_token 삭제 쿠키를 내려준다.
Spring 서버 장애 시 보안 우선으로 allow가 아니라 redirect를 선택한다.
```

보호 기준:

```text
/admin/login은 공개
/admin과 /admin/**은 verify 성공 시 접근 허용
verify 실패 시 /admin/login으로 redirect
관리자 API 자체도 Spring Security에서 반드시 401을 반환해야 함
```

### Product

현재:

```text
src/app/products/page.tsx → GET /api/products
src/components/ProductSearch.tsx → GET /api/products/search?q=
src/hooks/useProductAdmin.ts → GET/POST/PATCH/DELETE /api/products
src/app/contact/page.tsx → GET /api/products
```

전환:

```text
공개 목록: GET /api/products
관리자 전체 목록: GET /api/products?includeHidden=true
상세: GET /api/products/{id}
검색: GET /api/products/search?q=
등록: POST /api/products
수정: PATCH /api/products/{id}
삭제: DELETE /api/products/{id}
```

필수 변경:

```text
useProductAdmin의 목록 조회는 /api/products?includeHidden=true로 바꾼다.
공개 products page와 contact page는 /api/products 유지.
검색은 숨김 제품을 노출하지 않는다.
```

### Category

현재:

```text
src/hooks/useProductAdmin.ts → GET /api/categories?companyId=
src/hooks/useProductAdmin.ts → POST /api/categories
src/hooks/useProductAdmin.ts → DELETE /api/categories?id=
src/app/products/page.tsx → GET /api/categories
```

전환:

```text
GET /api/categories?companyId=
POST /api/categories
DELETE /api/categories?id=
```

주의:

```text
GET /api/categories는 companyId 필수다.
파라미터 없는 호출은 400을 유지한다.
src/app/products/page.tsx의 파라미터 없는 호출은 제거한다.
제품 페이지에서 전체 카테고리 표시가 필요하면 GET /api/products 응답의 category/companyId를 기준으로 프론트에서 그룹을 만든다.
회사별 카테고리 목록이 필요할 때만 GET /api/categories?companyId=를 호출한다.
```

결정:

```text
GET /api/categories 무파라미터 호출을 전체 카테고리 조회로 확장하지 않는다.
무파라미터 호출은 400 Bad Request로 유지한다.
프론트 전환 대상 파일에서 무파라미터 호출을 없애는 것이 완료 조건이다.
```

### Inquiry

현재:

```text
src/app/contact/page.tsx → POST /api/inquiries
src/hooks/useInquiry.ts → GET /api/inquiries
src/hooks/useInquiry.ts → DELETE /api/inquiries/{id}
```

전환:

```text
문의 등록: POST /api/inquiries
관리자 목록: GET /api/inquiries
관리자 삭제: DELETE /api/inquiries/{id}
```

주의:

```text
POST /api/inquiries는 공개 API다.
GET/DELETE /api/inquiries는 관리자 인증 필요.
메일 실패 응답은 502여도 inquirySaved=true이면 프론트는 접수 성공으로 안내한다.
삭제 성공 메시지는 "문의 내역이 삭제되었습니다." 유지.
```

## 응답 처리 기준

공통 실패 응답:

```json
{
  "success": false,
  "message": "오류 메시지"
}
```

문의 등록 예외:

```text
VALIDATION_FAILED
DB_WRITE_FAILED
MAIL_SEND_FAILED
inquirySaved
```

프론트 처리:

```text
관리자 API 401: 로그인 페이지 이동 또는 세션 만료 안내
관리자 API 403 CSRF_INVALID: CSRF token 폐기 후 재시도 안내
404: 사용자에게 찾을 수 없음 안내
409: 중복 카테고리 안내
문의 메일 실패: inquirySaved=true이면 접수 성공 안내
```

## 날짜 처리 기준

Spring API는 날짜를 문자열로 내려준다.

```text
2026-05-27T10:00:00.000Z
```

프론트는 Date 객체 직렬화 차이에 의존하지 않고 문자열로 렌더링하거나 필요한 곳에서만 파싱한다.

## 구현 순서

```text
1. src/lib/api/client.ts 생성
2. CSRF token 발급/요청 header 처리 구현
3. auth/products/categories/inquiries API client 생성
4. 공개 제품 목록/검색부터 교체
5. 문의 등록 교체
6. 관리자 로그인/로그아웃 교체
7. 관리자 제품/카테고리/문의 훅 교체
8. fetch('/api/') 잔여 검색
9. 화면 수동 검증
```

## 검증 기준

검색 명령:

```powershell
rg "fetch\\('/api|fetch\\(`/api|/api/products|/api/categories|/api/inquiries|/api/auth" src
```

완료 기준:

```text
브라우저 화면에서 공개 제품 목록이 보인다.
검색이 Spring API로 동작한다.
문의 등록이 성공한다.
관리자 로그인 후 새로고침해도 인증이 유지된다.
로그인과 관리자 변경 API가 CSRF token 없이는 403을 반환한다.
관리자 제품 목록은 숨김 제품을 포함한다.
공개 제품 목록은 숨김 제품을 포함하지 않는다.
관리자 카테고리 생성/삭제가 동작한다.
관리자 문의 목록/삭제가 동작한다.
```

## 실패하면 안 되는 기존 동작

```text
GET /api/auth/logout method를 POST로 바꾸지 않는다.
문의 등록 메일 실패 시 사용자에게 실패로만 안내하지 않는다.
Cloudinary 업로드 호출을 Spring API base URL에 붙이지 않는다.
공개 페이지에 isVisible=false 제품을 노출하지 않는다.
```
