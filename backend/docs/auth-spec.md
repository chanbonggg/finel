# Auth 도메인 구현 명세

작성일: 2026-05-30

## 목표

관리자 로그인, 로그아웃, 인증 상태 확인 기능을 Spring Boot로 이전한다.

이번 단계의 목표는 기존 Next.js API 응답 형태와 httpOnly 쿠키 기반 인증 방식을 유지하면서, 관리자 API를 보호할 수 있는 인증 기반을 만드는 것이다.

최종 사용자인 관리자는 기존 관리자 화면에서 로그인 상태를 유지하고, 로그아웃과 새로고침 후 인증 확인이 동일하게 동작해야 한다.

## 범위

이번에 할 일:

```text
POST /api/auth/login 구현
GET /api/auth/logout 구현
GET /api/auth/verify 구현
GET /api/auth/csrf 구현
AdminRepository 기반 관리자 조회
bcrypt password 검증
JWT 발급/검증
auth_token httpOnly 쿠키 발급/삭제
관리자 인증 필터 또는 Security 설정 구현
```

이번에 하지 않을 일:

```text
관리자 계정 생성 API
비밀번호 변경 API
권한 role 세분화
OAuth/Social login
Bearer token 저장 방식 전환
```

## 확정 기술 결정

```text
JWT algorithm: HS256
JWT lifetime: 43,200초
JWT claims: id, username, iat, exp
JWT secret: 최소 32바이트 무작위 값
JWT library: Spring Security OAuth2 Resource Server + Nimbus JOSE
Token source: auth_token HttpOnly cookie
CSRF: Spring Security 활성화
CSRF cookie/header: XSRF-TOKEN / X-XSRF-TOKEN
```

Auth 전환 시 기존 Next.js 세션을 유지하지 않는다. 배포 시 기존 `auth_token`을 만료시키고 한 번 재로그인한다.

다음 단계로 넘길 일:

```text
관리자 API별 세부 인가 정책 적용
운영 배포 도메인에 맞춘 Cookie Domain 최종 확정
토큰 만료/갱신 정책 고도화
```

## 현재 상태

기존 Next.js API:

```text
src/app/api/auth/login
src/app/api/auth/logout
src/app/api/auth/verify
src/lib/admin-auth.ts
src/proxy.ts
```

기존 DB:

```text
"Admin"
- id integer PK
- username text unique not null
- password text not null
- createdAt timestamp not null
```

현재 인증 방식:

```text
auth_token httpOnly cookie
JWT payload 기반 관리자 확인
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/auth/
├─ AuthController.java
├─ AuthService.java
├─ JwtTokenProvider.java
├─ CookieJwtResolver.java
├─ Admin.java
├─ AdminRepository.java
└─ dto/
   ├─ LoginRequest.java
   ├─ LoginResponse.java
   ├─ VerifyResponse.java
   └─ CsrfResponse.java
```

관련 config:

```text
backend/src/main/java/com/finel/backend/config/
├─ SecurityConfig.java
└─ CorsConfig.java
```

데이터 흐름:

```text
LoginRequest
→ AuthController
→ AuthService
→ AdminRepository.findByUsername()
→ BCryptPasswordEncoder.matches()
→ JwtTokenProvider.createToken()
→ Set-Cookie auth_token
→ LoginResponse
```

## 요구사항

기능 요구사항:

```text
username/password 누락 시 400
관리자 계정이 없거나 비밀번호가 틀리면 401
로그인 성공 시 auth_token 쿠키 발급
로그아웃 성공 시 auth_token 쿠키 만료
verify는 유효한 쿠키가 있으면 user.id, username, iat, exp를 반환
verify는 토큰이 없거나 유효하지 않으면 401
csrf는 인증 없이 token과 headerName을 반환
로그인 요청은 CSRF token이 없거나 틀리면 403
```

비기능 요구사항:

```text
JWT_SECRET은 운영에서 필수
쿠키는 httpOnly로 설정
운영에서는 Secure=true
프론트/백엔드 cross-origin이면 credentials CORS 허용
로그에는 password, JWT 원문을 남기지 않음
Spring Security CSRF를 disable하지 않음
로그인 API는 IP 기준 기본 5회/분 rate limit
```

권한 규칙:

```text
로그인: 공개
로그아웃: 공개
인증 확인: 관리자 쿠키 필요
관리자 API: auth_token 검증 필요
```

## API 계약

### POST /api/auth/login

Request:

로그인 화면은 먼저 `GET /api/auth/csrf`를 호출한 뒤 아래 header를 포함한다.

```http
X-XSRF-TOKEN: <csrf-token>
```

```json
{
  "username": "admin",
  "password": "password"
}
```

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "message": "로그인 성공"
}
```

Success cookie:

```http
Set-Cookie: auth_token=<jwt>; HttpOnly; Path=/; Max-Age=43200; SameSite=Lax
```

Failure:

```text
400 Bad Request: 아이디와 비밀번호를 입력해주세요.
401 Unauthorized: 아이디 또는 비밀번호가 올바르지 않습니다.
500 Internal Server Error: 서버 설정 오류
429 Too Many Requests: 로그인 시도 제한 초과
```

### GET /api/auth/logout

Request:

```http
GET /api/auth/logout
```

Success response:

```text
200 OK
```

```json
{
  "success": true,
  "message": "Logged out"
}
```

Cookie 처리:

```http
Set-Cookie: auth_token=; HttpOnly; Path=/; Max-Age=0
```

주의:

```text
기존 프론트 호환을 위해 POST가 아니라 GET을 유지한다.
삭제 쿠키는 로그인 쿠키와 Path, Domain, SameSite, Secure 속성이 일치해야 한다.
```

### GET /api/auth/verify

Request:

```http
GET /api/auth/verify
Cookie: auth_token=<jwt>
```

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "iat": 1710000000,
    "exp": 1710043200
  }
}
```

Failure:

```text
401 Unauthorized
```

```json
{
  "success": false,
  "message": "인증이 필요합니다."
}
```

### GET /api/auth/csrf

Request:

```http
GET /api/auth/csrf
```

Success:

```json
{
  "token": "<csrf-token>",
  "headerName": "X-XSRF-TOKEN"
}
```

응답은 `XSRF-TOKEN` cookie도 발급한다. 이 cookie만 JavaScript에서 읽을 수 있도록 `HttpOnly=false`로 두며, 인증 cookie인 `auth_token`은 계속 `HttpOnly=true`다.

## DTO 기준

```java
public record LoginRequest(
    String username,
    String password
) {}
```

```java
public record LoginResponse(
    boolean success,
    String message
) {}
```

```java
public record VerifyResponse(
    boolean success,
    UserInfo user
) {
    public record UserInfo(
        Integer id,
        String username,
        Long iat,
        Long exp
    ) {}
}
```

## Service 기준

`AuthService` 책임:

```text
로그인 입력값 검증
Admin 조회
bcrypt password 검증
JWT 생성
JWT 검증
쿠키 생성에 필요한 값 반환
```

`AuthService` 금지:

```text
HTTP response 직접 조작
DB 직접 SQL 작성
password/JWT 로그 출력
```

`JwtTokenProvider` 책임:

```text
JWT 생성
JWT 서명 검증
만료 검증
username claim 추출
id claim 추출
HS256 외 algorithm 거부
```

`CookieJwtResolver` 책임:

```text
auth_token cookie 추출
Authorization/localStorage token에 의존하지 않음
쿠키가 없으면 anonymous request로 전달
토큰 원문 로그 금지
```

## 쿠키/CORS 정책

환경별 쿠키:

```text
local:
  SameSite=Lax
  Secure=false
  Domain 미설정

production same-site:
  SameSite=Lax
  Secure=true
  Domain 필요 시에만 설정

production cross-site:
  정식 지원하지 않음
  same-site custom domain 또는 same-origin reverse proxy로 변경
```

CORS:

```text
allowedOrigins = FRONTEND_ORIGIN
allowCredentials = true
allowedMethods = GET, POST, PATCH, DELETE, OPTIONS
allowedHeaders = Content-Type, X-XSRF-TOKEN
```

CSRF:

```text
CookieCsrfTokenRepository 사용
CookieCsrfTokenRepository.withHttpOnlyFalse() 사용
cookie token을 header로 보내는 SPA용 CsrfTokenRequestHandler 적용
GET /api/auth/csrf 공개
POST /api/inquiries만 CSRF 검사 제외
로그인과 관리자 상태 변경 API는 X-XSRF-TOKEN 필수
실패 시 403 + CSRF_INVALID JSON
```

## 예외 처리

응답 형식:

```json
{
  "success": false,
  "message": "사용자에게 보여줄 수 있는 메시지"
}
```

로그 기준:

```text
로그인 실패: username만 기록 가능
비밀번호 원문 금지
JWT 원문 금지
JWT_SECRET 금지
```

## 테스트 기준

단위 테스트:

```text
username/password 누락
없는 username
비밀번호 불일치
비밀번호 일치 시 JWT 생성
유효 JWT 검증 성공
만료/변조 JWT 검증 실패
HS256이 아닌 JWT 거부
32바이트 미만 JWT_SECRET으로 애플리케이션 시작 실패
CSRF token 발급 및 검증
로그인 rate limit 초과 429
```

인증 실패 공통 응답:

```text
쿠키 없음: 401, 인증이 필요합니다.
토큰 만료: 401, 인증이 만료되었습니다.
토큰 변조/검증 실패: 401, 유효하지 않은 인증 정보입니다.
```

통합 테스트:

```text
POST /api/auth/login 성공 시 Set-Cookie 존재
POST /api/auth/login 실패 시 쿠키 없음
GET /api/auth/logout 성공 시 만료 쿠키 반환
GET /api/auth/verify 쿠키 없음 401
GET /api/auth/verify 유효 쿠키 200
GET /api/auth/csrf 200 + XSRF-TOKEN
CSRF 없는 로그인 403
CSRF 없는 관리자 변경 요청 403
```

완료 기준:

```text
기존 logout path와 method가 GET /api/auth/logout으로 유지된다.
로그인 응답 JSON이 api-contract.md와 일치한다.
쿠키가 httpOnly로 발급된다.
관리자 보호 API에서 재사용 가능한 인증 기반이 준비된다.
```
