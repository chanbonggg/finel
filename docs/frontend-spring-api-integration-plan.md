# Next.js 프론트엔드-Spring API 통합 구현 계획

작성일: 2026-06-24  
대상: `src/` Next.js 16 App Router 프론트엔드  
기준 구현: `backend/src/main/java/com/finel/backend` Spring Boot API

## 1. 목적과 범위

Spring 백엔드의 실제 Controller, DTO, Security 설정을 기준으로 프론트엔드의 API 호출, 타입, 인증/CSRF, 오류 처리, 환경 설정과 화면 동작을 정합화한다.

이 문서는 구현 순서와 완료 기준만 정의한다. 백엔드 계약 변경, UI 리뉴얼, Cloudinary 업로드 방식 변경, DB/Flyway 변경은 범위 밖이다.

## 2. 조사 기준과 현재 상태

우선순위는 다음과 같다.

1. 실제 Spring Controller/DTO/Security 코드
2. `docs/spring-migration-decisions.md`, `docs/migration-runbook.md`
3. `docs/api-contract.md`, `docs/env-cors-cookie-spec.md`, `docs/e2e-verification-spec.md`
4. 현재 `src/lib/api/*`, 페이지, 훅, `src/proxy.ts`

현재 프론트는 이미 `src/lib/api/*`를 통해 대부분 Spring API를 호출하며 Next API Route와 Prisma는 삭제된 상태다. 따라서 신규 전환이 아니라, 부분 전환 코드를 실제 계약에 맞게 완결하고 운영 안전성을 높이는 작업이다.

확인된 잔여 문제는 다음과 같다.

- 브라우저에서 `NEXT_PUBLIC_API_BASE_URL`이 없으면 삭제된 Next `/api`로 상대 호출한다. 이 fallback은 현재 구조에서는 조용한 오설정이다.
- 응답 타입과 오류 타입이 도메인별로 통합되지 않았고, 여러 화면이 `response.json()`과 `data.success`를 직접 해석한다.
- 관리자 API의 `401`, `403 CSRF_INVALID`, `409`, `429` 처리 정책이 화면마다 다르거나 없다.
- CSRF 403에서 메모리 토큰만 폐기하며, 재발급/안전한 1회 재시도 또는 사용자 안내가 없다.
- 제품 삭제는 응답 성공을 확인하지 않고 로컬 목록에서 제거한다. 로그아웃도 실패를 숨기고 로그인 화면으로 이동한다.
- 제품 등록 폼은 백엔드 필수값인 `spec`을 제출 전에 검증하지 않는다.
- 문의 폼은 백엔드 필수값인 문의 내용이 빈 상태로 제출될 수 있다. 반대로 백엔드는 email을 선택값으로 허용하지만 UI는 필수로 강제한다.
- `Product`, `Category`, `Inquiry` 타입이 API 모듈, 훅, 페이지에 중복 선언되어 null/optional 여부와 `updatedAt` 포함 여부가 다르다.
- `/admin` proxy의 Spring verify 요청에는 명시적 timeout이 없고, 실패 시 Spring이 발급한 쿠키 정책과 별개로 Next 응답에서 `auth_token` 삭제를 시도한다.
- 공개 목록/검색 화면은 네트워크 오류와 진짜 빈 결과를 구분하지 않아 사용자에게 잘못된 빈 상태를 보여줄 수 있다.

## 3. 확정 API 계약

### 3.1 공개/조회 API

| API | 성공 응답 핵심 | 프론트 소비 위치 | 주의사항 |
| --- | --- | --- | --- |
| `GET /api/products` | `200 { success, products: Product[] }` | `/products`, 문의 제품 선택 | visible 제품만 반환 |
| `GET /api/products?categoryId={id}` | 동일 | 카테고리 상세 | 없는 카테고리 404, 제품 없음은 빈 배열 |
| `GET /api/products/featured?limit=4` | 동일 | 홈 | limit은 백엔드에서 1~12로 정규화 |
| `GET /api/products/search?q=` | 동일 | `ProductSearch` | 빈 q는 빈 배열, 최대 10개 |
| `GET /api/products/{id}` | `200 { success, product }` | 제품 상세/metadata | 숨김·없는 제품 404 |
| `GET /api/categories?companyId={id}` | `200 { success, categories }` | 관리자 카테고리 | `companyId` 필수, 이름 오름차순 |
| `GET /api/categories/{id}` | `200 { success, category }` | 카테고리 상세/metadata | 없음 404 |
| `GET /api/sitemap-data` | `{ success, products, categories }` | sitemap | 제품은 `id`, `updatedAt`; 카테고리는 `id`만 |

`ProductResponse`는 `id`, `name`, `categoryId`, 문자열 `category`, 최상위 `companyId`, `spec`, `description`, `imageUrl`, `isVisible`, `createdAt`, `updatedAt`을 포함한다. 날짜는 UTC 밀리초 포함 ISO 문자열이다.

### 3.2 문의 API

- `POST /api/inquiries`는 공개이며 CSRF 예외다.
- 현재 폼의 legacy 필드 `phone`, `content`, `product`도 백엔드가 지원한다. 새 표준 필드 `phoneNumber`, `message`, `productName`으로 프론트를 정리하되 한 번에 혼용하지 않는다.
- 성공: `201`, `success=true`, `stage=DONE`, `mailSent=true`, `inquirySaved=true`, `inquiryId`, `inquiry`.
- 검증 실패: `400`, `VALIDATION_FAILED`, `stage=VALIDATION`.
- DB 실패: `500`, `DB_WRITE_FAILED`, `stage=DB_WRITE`, `inquirySaved=false`.
- 메일 실패: `502`, `MAIL_SEND_FAILED`, `stage=MAIL_SEND`, `inquirySaved=true`, `inquiryId`. 이 경우 UI는 접수 성공으로 처리하되 알림 전송 실패 내부 정보는 노출하지 않는다.
- rate limit: IP 기준 3회/10분, 초과 시 `429 RATE_LIMITED`.

### 3.3 인증과 관리자 API

- 인증 저장소는 `auth_token` HttpOnly cookie이고 모든 브라우저 API 요청은 `credentials: 'include'`를 사용한다.
- `GET /api/auth/csrf`는 `{ success, token, headerName }`과 `XSRF-TOKEN` cookie를 발급한다.
- `POST /api/auth/login` 및 관리자 `POST/PATCH/DELETE`는 `X-XSRF-TOKEN`이 필수다.
- 로그인 성공은 `200 { success, message: "로그인 성공", user }`이며, 실패 경계는 입력 오류 400, 인증 실패 401, CSRF 403, rate limit 429다.
- `GET /api/auth/verify`는 인증 성공 시 `{ success, user: { id, username, iat, exp } }`, 실패 시 401이다.
- 로그아웃은 호환 계약상 `GET /api/auth/logout`이며 성공 메시지는 `Logged out`이다.
- 관리자 목록: `GET /api/products?includeHidden=true`, `GET /api/inquiries`.
- 관리자 변경: 제품 POST/PATCH/DELETE, 카테고리 POST/DELETE, 문의 DELETE.
- `includeHidden=true`와 `categoryId` 동시 사용은 400이다.
- 인증 없음/만료는 401, CSRF 오류는 `403 CSRF_INVALID`, 중복 카테고리는 409, 공개 제한 초과는 429다.

## 4. 목표 아키텍처

### 4.1 공통 API 계층

`src/lib/api/client.ts`가 base URL 결정, credentials, JSON header, 응답 파싱과 공통 오류 생성을 단일 책임으로 가진다.

- 서버: `SERVER_API_BASE_URL` 우선, 없으면 `NEXT_PUBLIC_API_BASE_URL`.
- 브라우저: `NEXT_PUBLIC_API_BASE_URL` 필수. 운영에서 의도적으로 same-origin reverse proxy를 쓸 경우에만 별도 명시 설정으로 빈 base를 허용한다.
- base URL 끝 `/`과 API path 시작 `/`을 정규화한다.
- JSON이 아닌 오류 응답/빈 응답도 처리할 수 있도록 안전한 parser를 둔다.
- `ApiError`에 최소 `status`, `message`, `errorCode`, `stage`, `data`를 보존한다.
- `AbortError`와 설정 오류는 API 오류와 구분한다.
- 서버 렌더링 요청은 공개 API만 사용한다. 관리자 쿠키 전달이 필요해질 경우 암묵적으로 `credentials`에 기대지 말고 명시적으로 cookie header를 전달한다.

### 4.2 계약 타입 단일화

`src/lib/api/types.ts` 또는 도메인별 API 파일에 다음 타입을 단일 정의하고 페이지/훅의 중복 인터페이스를 제거한다.

- `Product`, `Category`, `Inquiry`
- `ApiErrorBody`, `MessageResponse`
- `LoginResponse`, `VerifyResponse`, `CsrfResponse`
- `InquiryCreateRequest`, `InquiryCreateResponse`
- 제품/카테고리 create/update request 타입

API가 빈 문자열을 반환하는 `description`, `imageUrl`, `email`은 기본 계약상 `string`으로 둔다. UI의 입력 중간 상태만 별도 form 타입에서 optional/빈 문자열로 표현한다.

### 4.3 인증/CSRF 상태

- CSRF 토큰은 브라우저 메모리에만 보관하고 localStorage/sessionStorage에 저장하지 않는다.
- 로그인 및 관리자 변경 전에 토큰을 가져와 백엔드가 반환한 `headerName`을 검증하거나 고정 계약 `X-XSRF-TOKEN`을 사용한다.
- `403`이면서 `errorCode === 'CSRF_INVALID'`일 때만 토큰을 폐기한다.
- 자동 재시도는 멱등성 위험을 고려한다. 제품/카테고리 생성처럼 중복 생성 위험이 있는 POST는 무조건 재시도하지 않는다. 권장안은 토큰을 재발급한 뒤 사용자가 다시 실행하도록 명확히 안내하는 것이다. DELETE/PATCH도 서버 적용 여부가 불명확한 네트워크 실패에는 자동 재시도하지 않는다.
- 401은 공통 세션 만료 경로로 보내되, 공개 API 오류에는 적용하지 않는다. 관리자 훅에서 `/admin/login` 이동과 사용자 안내를 일관되게 수행한다.
- 로그아웃은 응답 성공을 확인한 뒤 이동한다. 네트워크 실패 시 쿠키가 남아 있을 수 있음을 알리고 재시도할 수 있게 한다.

### 4.4 화면 오류 상태

alert만 사용하는 현재 구현을 최소 변경하되, 다음 상태를 구분한다.

- 로딩 중
- 성공했지만 빈 결과
- 네트워크/설정/서버 오류
- 인증 만료 401
- CSRF 403
- 검증 400
- 중복 409
- rate limit 429
- 문의 저장 성공 + 메일 실패 502

오류 상세나 SMTP 내부 정보는 사용자에게 노출하지 않고 서버의 공개 `message`만 사용한다.

## 5. 파일별 변경 계획

### 5.1 API 기반 계층

1. `src/lib/api/client.ts`
   - browser/server base URL 정책을 명시하고 빈 browser base의 레거시 fallback 제거 여부를 배포 토폴로지와 함께 확정한다.
   - URL 정규화, 안전한 JSON parsing, typed `ApiError`를 구현한다.
   - `credentials: 'include'` 및 JSON body에만 Content-Type을 설정하는 현재 동작을 유지한다.
2. `src/lib/api/auth.ts`
   - CSRF 응답 전체 타입과 오류 코드를 사용한다.
   - 403 전체가 아닌 `CSRF_INVALID`에서만 token cache를 무효화한다.
   - login/logout/verify 계약 함수를 명시적으로 제공하고 성공 status를 확인한다.
3. `products.ts`, `categories.ts`, `inquiries.ts`, `public-meta.ts`
   - `unknown` request body를 구체 타입으로 교체한다.
   - raw `Response` 반환을 줄이고 성공 타입 또는 `ApiError`로 일관되게 반환한다.
   - 404를 `null`로 바꾸는 것은 상세/metadata 함수에만 유지한다. 설정 오류를 404로 위장하는 현재 build fallback은 별도 wrapper로 분리한다.

### 5.2 공개 페이지와 컴포넌트

1. `src/app/page.tsx`, `src/app/sitemap.ts`
   - build/prerender fallback과 런타임 장애를 구분한다. 설정 누락을 운영에서 빈 데이터로 숨기지 않는다.
2. `src/app/products/page.tsx`
   - 공통 `Product` 타입을 사용한다.
   - 공개 API가 이미 visible만 반환하므로 중복 visibility 필터는 방어 로직으로만 명시한다.
   - 빈 목록과 로드 실패 UI를 분리한다.
3. `src/app/products/[id]/page.tsx`, `src/app/products/category/[id]/page.tsx`
   - 404만 `notFound()`로 변환하고 5xx/network/config 오류는 오류 경계로 전달한다.
   - metadata와 본문이 같은 fetch 결과를 재사용하는 현재 cache 의도를 유지한다.
4. `src/components/ProductSearch.tsx`
   - AbortError와 실제 실패를 분리하고 실패 메시지를 빈 검색 결과로 표시하지 않는다.
5. `src/app/contact/page.tsx`
   - 표준 inquiry 필드명으로 request 타입을 맞춘다.
   - 문의 내용을 클라이언트에서도 필수 검증한다.
   - email을 계속 UI 필수로 둘지는 제품 정책 결정이 필요하다. 백엔드 정합성만 기준으로 하면 optional로 맞추는 것이 일관적이다.
   - 201과 `502 + inquirySaved=true`만 접수 성공으로 처리하고, 400/429/500을 구분한다.

### 5.3 관리자 페이지와 훅

1. `src/hooks/useProductAdmin.ts`
   - 중복 Product/Category 타입 제거.
   - 생성 전에 name/categoryId/spec 검증.
   - 모든 create/update/delete에서 HTTP 성공과 응답 계약 확인 후 로컬 상태 갱신.
   - 400/401/403/404/409를 구분해 메시지와 로그인 이동 처리.
   - hidden 제품 수정은 현재처럼 관리자 목록의 데이터를 사용하고 공개 상세 API를 호출하지 않는다.
   - Cloudinary 호출은 Spring base URL 및 공통 API client 밖에 유지한다.
2. `src/hooks/useInquiry.ts`
   - 관리자 목록 401과 일반 서버 실패를 분리한다.
   - 삭제 성공 확인 뒤에만 로컬 목록을 변경한다.
3. `src/app/admin/login/page.tsx`, `src/app/admin/page.tsx`
   - 로그인 400/401/403/429 메시지를 구분한다.
   - 로그아웃 실패를 숨기지 않고, 성공 후에만 dashboard 접근 상태를 종료한다.
4. `src/proxy.ts`
   - verify 요청에 짧고 명시적인 timeout을 추가한다.
   - 200만 통과시키는 fail-closed 정책을 유지한다.
   - 원 요청 Cookie만 전달하고 JWT를 해석하지 않는다.
   - redirect 응답에서 임의로 auth cookie를 삭제하지 않는다. 쿠키 삭제는 Spring logout 계약이 소유한다.
   - `/admin/login` 공개와 matcher 동작을 회귀 검증한다.

## 6. 환경·배포 계획

로컬 기준:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
SERVER_API_BASE_URL=http://localhost:8080
FRONTEND_ORIGIN=http://localhost:3000
AUTH_COOKIE_SECURE=false
```

운영은 `https://www.finel.co.kr` + `https://api.finel.co.kr` 같은 same-site 구성을 우선한다.

- Spring `FRONTEND_ORIGIN`은 실제 브라우저 origin과 정확히 일치해야 한다. wildcard와 credentials 조합은 금지한다.
- CORS methods는 GET/POST/PATCH/DELETE/OPTIONS, headers는 Content-Type/X-XSRF-TOKEN이어야 한다.
- 운영 `AUTH_COOKIE_SECURE=true`, `SameSite=Lax`, `Path=/`을 유지한다.
- `AUTH_COOKIE_DOMAIN`은 기본 미설정이다. 프론트에서 백엔드 origin으로 직접 요청하면 host-only cookie는 API host에 저장되어 정상 전송된다. 부모 domain 공유는 배포 요구가 확인된 경우만 사용한다.
- `SERVER_API_BASE_URL`은 Next 서버/빌드 환경에서 접근 가능한 주소여야 한다. 브라우저 공개 URL과 내부 서버 URL이 다를 수 있다.
- 서로 다른 site인 임시 배포 도메인 조합은 인증 쿠키 지원 대상으로 간주하지 않는다.
- `.env` 값과 secret은 문서, 로그, 클라이언트 bundle에 기록하지 않는다.

## 7. 단계별 실행 순서

### 단계 1: 계약 타입과 공통 오류 계층

- API DTO 타입을 단일화한다.
- `ApiError`와 안전한 JSON parser를 추가한다.
- 기존 API 함수 시그니처를 typed request/response로 교체한다.

완료 기준: 화면과 훅에 중복 API entity 타입이 없고, `unknown` body와 무분별한 `response.json()`이 제거된다.

### 단계 2: 인증·CSRF·proxy 정합화

- CSRF 발급/캐시/무효화 정책을 구현한다.
- 관리자 401/403 공통 처리를 연결한다.
- login/logout/verify와 proxy timeout/cookie 책임을 정리한다.

완료 기준: 로그인 POST와 모든 관리자 변경 요청에 CSRF header가 있고, 401/403이 일관되며, Next는 JWT를 해석하지 않는다.

### 단계 3: 공개 화면 전환 완결

- 제품 목록/상세/category/featured/search/sitemap 오류 경계를 정리한다.
- 문의 payload/검증/201·502·429 처리를 맞춘다.

완료 기준: 숨김 제품 미노출, 404와 장애 구분, 문의 메일 실패 접수 성공 UX가 보장된다.

### 단계 4: 관리자 CRUD 안정화

- 제품/카테고리/문의 훅에서 성공 응답 확인 후 상태를 갱신한다.
- spec 필수 검증, 409/400 메시지, 세션 만료 이동을 반영한다.

완료 기준: 실패한 삭제가 화면에서 사라지지 않고, hidden 제품 관리와 카테고리 삭제 제한이 정확히 표현된다.

### 단계 5: 설정과 회귀 검증

- 로컬 cross-origin 및 운영 same-site 설정을 검증한다.
- lint/build/API/E2E 게이트를 실행한다.
- 잔여 상대 `/api` 직접 fetch, Prisma, Next API Route가 없는지 검색한다.

## 8. 테스트와 검증

### 정적 검증

```powershell
rg "fetch\('/api|fetch\(`/api" src
rg "@/lib/prisma|@prisma/client|prisma\." src package.json
Test-Path src/app/api
npm run lint
npm run build
```

허용되는 직접 fetch는 Spring verify를 수행하는 `src/proxy.ts`와 Cloudinary 업로드뿐이어야 한다.

### API client 단위 테스트 권장 범위

- browser/server base URL 선택과 누락 오류
- JSON/non-JSON/빈 오류 응답 parsing
- credentials와 Content-Type 동작
- CSRF 토큰 1회 발급, `X-XSRF-TOKEN` 첨부, `CSRF_INVALID` 무효화
- 401/403/404/409/429 typed error 변환
- 문의 502 `inquirySaved=true` 보존

현재 package에는 테스트 runner가 없으므로 Vitest 등 도입은 별도 의존성 변경으로 명시하고, 도입하지 않으면 E2E와 수동 Network 검증으로 보완한다.

### 브라우저/E2E 필수 시나리오

1. 공개 제품 목록/상세/검색/category/featured가 Spring origin을 호출하고 hidden 제품을 제외한다.
2. 존재하지 않는 제품/카테고리는 404 UI가 되며, backend 장애는 404로 위장되지 않는다.
3. 문의 201은 성공, 502 `inquirySaved=true`도 접수 성공, 400/429/500은 각기 올바른 안내를 한다.
4. CSRF 없이 login/관리자 변경 요청은 403 `CSRF_INVALID`; 정상 UI 요청은 CSRF header를 포함한다.
5. 로그인 후 새로고침에도 `/admin` 유지, verify 200, 쿠키는 HttpOnly다.
6. 관리자 제품 등록/수정/숨김/삭제, 카테고리 추가/409 중복/연결 제품 삭제 거부, 문의 목록/삭제를 검증한다.
7. 실패한 변경 요청 후 UI가 성공 상태로 낙관 갱신되지 않는다.
8. logout 성공 후 cookie 삭제, verify와 관리자 API가 401이다.
9. proxy의 backend timeout/network/5xx는 `/admin/login`으로 fail-closed한다.

## 9. 완료 조건

- 프론트 API 타입이 실제 Spring DTO와 일치한다.
- 모든 Spring 브라우저 요청은 credentials를 포함하고, 관리자 변경은 CSRF header를 포함한다.
- 401, CSRF 403, validation 400, 404, 409, 429, 5xx가 화면에서 구분된다.
- 문의의 `502 + inquirySaved=true`가 접수 실패로 표시되지 않는다.
- 실패한 CRUD 요청이 로컬 성공 상태로 반영되지 않는다.
- 공개 화면과 sitemap에 hidden 제품이 노출되지 않는다.
- `/admin` guard는 Spring verify만 사용하고 timeout/network 오류에서 fail-closed한다.
- Next API Route, Prisma import, 일반 화면의 상대 `/api` 직접 fetch가 없다.
- `npm run lint`, `npm run build` 및 `docs/e2e-verification-spec.md`의 관련 시나리오가 통과한다.

## 10. 구현 전 확인이 필요한 결정

다음 두 항목은 코드에서 확정할 수 없는 배포/제품 결정이다.

1. 운영 브라우저가 API subdomain을 직접 호출할지, Next same-origin reverse proxy를 사용할지 확정해야 한다. 현재 코드는 직접 호출 방식에 가깝고 `next.config.ts`에는 rewrite가 없다.
2. 문의 email을 UI에서도 선택값으로 바꿀지 결정해야 한다. 백엔드는 선택값이지만 현재 UI 문구와 HTML validation은 필수다.

이 두 결정 외의 작업은 현재 Spring 계약을 기준으로 바로 구현할 수 있다.
