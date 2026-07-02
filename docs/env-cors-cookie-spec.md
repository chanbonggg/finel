# Environment, CORS, Cookie Spec

작성일: 2026-05-31

## 목표

Next.js 프론트엔드와 Spring Boot 백엔드가 분리 실행될 때 환경 변수, CORS, 인증 쿠키 정책을 명확히 한다.

이번 단계의 문제는 관리자 인증이 CORS, credentials, SameSite, Secure 설정 중 하나만 틀려도 깨질 수 있다는 점이다. 최종 상태에서는 로컬/운영 환경 모두에서 로그인, 인증 확인, 로그아웃, 관리자 API 호출이 안정적으로 동작해야 한다.

## 범위

이번에 할 일:

```text
Next.js 환경 변수 기준
Spring Boot 환경 변수 기준
로컬/운영 origin 기준
CORS allow origin/credentials 기준
auth_token cookie SameSite/Secure/Domain 기준
CSRF token cookie/header 기준
JWT_SECRET 필수 시점
MAIL_* 변수 기준
DB 변수 기준
```

이번에 하지 않을 일:

```text
인프라 공급자 최종 선택
도메인 구매/SSL 발급 절차
Secret Manager 구체 구현
OAuth 또는 refresh token 정책
```

## 환경 구성

### 로컬 개발

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
Database: local PostgreSQL 또는 개발 DB
```

Next.js:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
SERVER_API_BASE_URL=http://localhost:8080
```

Spring:

```text
FRONTEND_ORIGIN=http://localhost:3000
```

### 운영 same-site

예시:

```text
Frontend: https://www.finel.example.com
Backend:  https://www.finel.example.com/api 또는 https://api.finel.example.com
```

정책:

```text
같은 site로 판정되면 SameSite=Lax 사용 가능
Secure=true 필수
Domain은 필요할 때만 명시
```

### 운영 cross-site

예시:

```text
Frontend: https://finel.vercel.app
Backend:  https://finel-api.onrender.com
```

판정:

```text
정식 운영 지원 대상이 아니다.
서드파티 쿠키 차단으로 관리자 인증이 브라우저별로 실패할 수 있다.
same-site custom domain 또는 Next.js reverse proxy로 변경해야 한다.
```

운영 확정 구조는 `www.finel.co.kr`과 `api.finel.co.kr` 같은 same-site 조합이다. 서로 다른 site가 불가피하면 이 명세의 cookie 인증을 그대로 적용하지 않고 인증 구조를 별도로 재설계한다.

## Next.js 환경 변수

필수:

```text
NEXT_PUBLIC_API_BASE_URL
```

선택:

```text
SERVER_API_BASE_URL
NEXT_PUBLIC_SITE_URL
```

금지:

```text
NEXT_PUBLIC_JWT_SECRET
NEXT_PUBLIC_DB_URL
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_MAIL_PASSWORD
NEXT_PUBLIC_MAIL_USERNAME
```

주의:

```text
NEXT_PUBLIC_* 변수는 브라우저에 노출된다.
민감정보는 절대 NEXT_PUBLIC_*로 만들지 않는다.
SERVER_API_BASE_URL은 Next.js 서버/proxy에서 Spring API를 호출할 때만 사용한다.
SERVER_API_BASE_URL이 없으면 서버/proxy도 NEXT_PUBLIC_API_BASE_URL을 fallback으로 사용할 수 있다.
```

## Spring Boot 환경 변수

DB:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

Auth:

```text
JWT_SECRET
FRONTEND_ORIGIN
```

Mail:

```text
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
MAIL_TO
MAIL_HOST
MAIL_PORT
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_FOLDER
```

기존 변수 매핑:

```text
DATABASE_URL      -> DB_URL + DB_USERNAME + DB_PASSWORD
JWT_SECRET        -> JWT_SECRET
EMAIL_USER        -> MAIL_USERNAME
EMAIL_PASS        -> MAIL_PASSWORD
EMAIL_FROM        -> MAIL_FROM
EMAIL_TO          -> MAIL_TO
```

필수 시점:

```text
2단계 skeleton: FRONTEND_ORIGIN만 필수, JWT_SECRET은 placeholder 가능
3단계 DB 모델: DB_URL, DB_USERNAME, DB_PASSWORD 필수
Auth 구현: JWT_SECRET 필수
Mail 구현: MAIL_USERNAME, MAIL_PASSWORD, MAIL_TO 필수
운영 배포: 모든 운영 secret 필수
```

## CORS 정책

Spring CORS 기본:

```text
allowedOrigins = FRONTEND_ORIGIN
allowCredentials = true
allowedMethods = GET, POST, PATCH, DELETE, OPTIONS
allowedHeaders = Content-Type, X-XSRF-TOKEN
```

금지:

```text
allowCredentials=true와 allowedOrigins=* 조합 금지
운영에서 localhost origin 허용 금지
불필요한 origin 다중 허용 금지
```

preflight:

```text
OPTIONS 요청은 인증 없이 통과
응답에 Access-Control-Allow-Credentials: true 포함
응답에 정확한 Access-Control-Allow-Origin 포함
```

## Cookie 정책

쿠키 이름:

```text
auth_token
XSRF-TOKEN
```

`auth_token` 공통:

```text
HttpOnly=true
Path=/
Max-Age=43200
```

`XSRF-TOKEN` 공통:

```text
HttpOnly=false
Path=/
요청 header X-XSRF-TOKEN과 값 일치 필수
```

Spring Security는 `CookieCsrfTokenRepository.withHttpOnlyFalse()`와 cookie/header SPA 흐름을 처리하는 `CsrfTokenRequestHandler`를 사용한다. 기본 request handler와 cookie token encoding 차이를 그대로 두지 않는다.

로컬:

```text
SameSite=Lax
Secure=false
Domain 미설정
```

운영 same-site:

```text
SameSite=Lax
Secure=true
동일 host 또는 same-origin reverse proxy: Domain 미설정
www.finel.co.kr + api.finel.co.kr에서 Next /admin proxy 사용: Domain=finel.co.kr
```

`api.finel.co.kr`의 host-only `auth_token`은 `www.finel.co.kr` 요청에 포함되지 않는다. 현재 `src/proxy.ts`는 브라우저의 `/admin` 요청에서 받은 Cookie를 Spring `/api/auth/verify`로 전달하므로, 이 분리 배포에서는 Spring에 `AUTH_COOKIE_DOMAIN=finel.co.kr`를 설정해야 한다. 이 설정은 모든 `*.finel.co.kr` 호스트로 쿠키 전송 범위를 넓히므로 해당 하위 도메인은 모두 신뢰·통제되어야 한다. 쿠키 범위를 넓힐 수 없다면 API를 프론트와 같은 origin으로 reverse proxy해야 한다.

운영 cross-site:

```text
지원하지 않음
SameSite=None만으로 서드파티 쿠키 차단을 해결할 수 없음
```

금지:

```text
cross-site 배포에서 SameSite=Strict 사용
HTTPS 운영에서 Secure=false 사용
로그아웃 쿠키에 로그인과 다른 Path/Domain 사용
Spring Security csrf.disable() 사용
```

로그아웃:

```text
GET /api/auth/logout
Set-Cookie: auth_token=; Max-Age=0; Path=/; HttpOnly
```

삭제 쿠키는 발급 쿠키와 다음 속성이 일치해야 한다.

```text
Path
Domain
SameSite
Secure
```

## CSRF 정책

토큰 발급:

```text
GET /api/auth/csrf
공개 API
XSRF-TOKEN cookie 발급
응답 body에 token과 headerName 반환
```

보호 대상:

```text
POST /api/auth/login
POST/PATCH/DELETE /api/products/**
POST/DELETE /api/categories/**
DELETE /api/inquiries/**
향후 추가되는 모든 cookie 인증 상태 변경 API
```

예외:

```text
POST /api/inquiries: 인증 cookie를 사용하지 않는 공개 등록 API이므로 CSRF 검사 제외
GET /api/auth/logout: 기존 호환용 세션 종료 API이므로 CSRF 검사 대상 아님
OPTIONS: preflight이므로 검사 제외
```

실패 응답:

```json
{
  "success": false,
  "errorCode": "CSRF_INVALID",
  "message": "요청 보안 토큰이 유효하지 않습니다."
}
```

status는 `403 Forbidden`이다. Spring 기본 HTML 오류 페이지를 반환하지 않고 공통 JSON 응답으로 변환한다.

## 프론트 fetch 기준

모든 Spring API 호출:

```ts
fetch(url, {
  credentials: 'include',
});
```

로그인과 관리자 변경 요청은 먼저 `GET /api/auth/csrf`를 호출하고 응답 token을 `X-XSRF-TOKEN` header로 보낸다. CSRF 토큰을 localStorage/sessionStorage에 영구 저장하지 않고 메모리 또는 `XSRF-TOKEN` cookie에서 읽는다.

로그인 성공과 로그아웃 성공 후 프론트의 메모리 CSRF token을 폐기한다. 다음 상태 변경 요청 전에 `GET /api/auth/csrf`로 새 token을 받는다.

관리자 API:

```text
credentials 누락 금지
POST/PATCH/DELETE에서 X-XSRF-TOKEN 누락 금지
401이면 로그인 화면 이동 또는 세션 만료 안내
403 CSRF_INVALID이면 토큰을 다시 발급한 뒤 사용자가 작업을 재시도하도록 안내
```

공개 API:

```text
credentials 포함 허용
쿠키가 없어도 동작해야 함
```

## 인증 실패 응답

공통:

```json
{
  "success": false,
  "message": "인증이 필요합니다."
}
```

권장 메시지:

```text
쿠키 없음: 인증이 필요합니다.
토큰 만료: 인증이 만료되었습니다.
토큰 변조/검증 실패: 유효하지 않은 인증 정보입니다.
```

status:

```text
401 Unauthorized
```

## Next.js /admin 페이지 보호

결정:

```text
Spring 인증 구현 후 Next.js는 JWT를 직접 검증하지 않는다.
Next.js /admin 보호는 Spring GET /api/auth/verify를 호출해 판단한다.
src/lib/admin-auth.ts의 JWT_SECRET 기반 검증은 Spring 전환 완료 후 제거한다.
```

권장 흐름:

```text
브라우저 /admin 접근
→ src/proxy.ts 또는 route guard가 Cookie: auth_token을 읽음
→ SERVER_API_BASE_URL/api/auth/verify로 Cookie 헤더를 그대로 전달
→ 200이면 /admin 접근 허용
→ 401이면 /admin/login redirect
```

구현 기준:

```text
verify 요청에는 원 요청의 Cookie 헤더만 전달한다.
Authorization 헤더를 새로 만들지 않는다.
브라우저 fetch가 아니라 Next.js server/proxy 런타임에서 Spring verify를 호출한다.
Spring verify 응답 body는 proxy에서 신뢰하지 말고 status code만 판단한다.
Spring verify가 200이면 통과, 그 외 status는 실패로 처리한다.
Spring 서버 네트워크 오류, timeout, 5xx는 보안 우선으로 실패 처리하고 /admin/login으로 redirect한다.
Next proxy는 인증 쿠키를 삭제하지 않는다. 발급 당시 Domain/SameSite/Secure 속성을 아는 Spring logout API가 삭제를 소유한다.
```

proxy pseudo-code:

```ts
const cookie = request.headers.get('cookie') ?? '';
const verify = await fetch(`${SERVER_API_BASE_URL}/api/auth/verify`, {
  method: 'GET',
  headers: { cookie },
  cache: 'no-store',
});

if (verify.status === 200) return NextResponse.next();
return NextResponse.redirect(new URL('/admin/login', request.url));
```

주의:

```text
/admin UI는 보호하되, 보안의 최종 경계는 Spring 관리자 API 401이다.
프론트 guard만 믿고 관리자 API 보호를 생략하지 않는다.
Next.js에는 JWT_SECRET을 더 이상 필수로 두지 않는다.
```

## 운영 DB 보호

```text
운영 DB URL은 로컬 test profile에 사용하지 않는다.
Spring ddl-auto는 운영에서 validate 또는 none만 허용한다.
update/create/create-drop 금지.
DB_URL은 로그에 출력하지 않는다.
```

## 수동 확인 방법

브라우저 개발자도구:

```text
로그인 응답 Set-Cookie 확인
Application 탭에서 auth_token httpOnly 확인
관리자 API Request Headers에 Cookie 포함 확인
로그아웃 후 auth_token 삭제 확인
```

curl 로컬 예시:

```powershell
curl.exe -i -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"password\"}"
```

CORS 확인:

```text
Access-Control-Allow-Origin이 FRONTEND_ORIGIN과 정확히 일치
Access-Control-Allow-Credentials=true
Access-Control-Allow-Headers에 X-XSRF-TOKEN 포함
```

## 완료 기준

```text
로컬에서 로그인 쿠키가 저장된다.
로컬에서 verify가 200을 반환한다.
로그아웃 후 verify가 401을 반환한다.
운영 배포 구조별 SameSite/Secure 정책이 확정되어 있다.
운영은 same-site 배포이며 cross-site cookie에 의존하지 않는다.
allowedOrigins에 wildcard가 없다.
로그인/관리자 변경 요청에서 CSRF 검증이 동작한다.
민감정보가 NEXT_PUBLIC_*로 노출되지 않는다.
운영 DB 스키마 자동 변경 설정이 없다.
```

## 이번 단계에서 하지 않을 일

```text
도메인/인프라 최종 선택
refresh token 도입
Secret Manager 연동 구현
프론트 인증 UX 전면 개편
```
