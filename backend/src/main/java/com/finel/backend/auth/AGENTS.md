# Auth 패키지 작업 지침

이 파일은 `com.finel.backend.auth`와 하위 `dto` 패키지에 적용된다.

## 작업 전 확인할 문서

다음 순서로 현재 명세를 확인한다.

1. `docs/spring-migration-decisions.md`
2. `docs/migration-runbook.md`
3. `docs/api-contract.md`의 인증 API와 관리자 보호 규칙
4. `docs/env-cors-cookie-spec.md`
5. `backend/docs/auth-spec.md`

문서가 충돌하면 `spring-migration-decisions.md`와 `migration-runbook.md`를 우선한다. 기존 Next.js 인증 구현은 호환성 조사 자료이지 Spring 구현의 최종 기준이 아니다.

## 패키지 책임

- `AuthController`: `/api/auth/login`, `/api/auth/logout`, `/api/auth/verify`, `/api/auth/csrf`의 HTTP 계약과 쿠키 응답을 처리한다.
- `AuthService`: 입력 검증, 관리자 조회, bcrypt 검증, JWT 생성·검증에 필요한 인증 흐름을 조정한다.
- `AdminRepository`: `Admin` 조회만 담당한다. SQL을 서비스에 작성하지 않는다.
- JWT 생성·검증과 `auth_token` 쿠키 추출은 각각 별도 컴포넌트로 분리한다.
- DTO는 Entity와 분리하고 `auth/dto`에 둔다. 요청을 Entity에 직접 바인딩하지 않는다.
- Spring Security 전역 정책은 `config/SecurityConfig.java`, CORS는 `config/CorsConfig.java`에 둔다.

## 고정 계약

- 인증 저장소는 `auth_token` HttpOnly cookie이며 Authorization header나 localStorage로 바꾸지 않는다.
- JWT는 HS256, 수명 43,200초, 필수 claim은 `id`, `username`, `iat`, `exp`다.
- `JWT_SECRET`은 운영에서 필수이며 최소 32바이트다. 비밀번호, JWT 원문, secret을 로그에 남기지 않는다.
- 비밀번호는 기존 bcrypt hash와 호환되는 `BCryptPasswordEncoder`로 검증한다.
- 로그인은 `POST /api/auth/login`, 로그아웃은 기존 호환 때문에 `GET /api/auth/logout`을 유지한다.
- 로그인 성공은 200과 `success=true`, 로그아웃 성공은 만료된 `auth_token` 쿠키를 반환한다.
- verify는 유효한 cookie가 있을 때만 200과 사용자 claim을 반환하며, 없거나 잘못되면 401이다.
- `GET /api/auth/csrf`는 공개 API이며 `XSRF-TOKEN` cookie와 `X-XSRF-TOKEN` header 이름을 제공한다.
- 로그인과 관리자 상태 변경 요청에서 CSRF를 활성화한다. 공개 `POST /api/inquiries`와 OPTIONS만 명세된 예외로 둔다.
- cookie는 로컬에서 `Secure=false`, 운영 same-site에서 `Secure=true`, 공통 `SameSite=Lax`, `Path=/`다. 로그인과 삭제 cookie의 속성을 일치시킨다.
- 로그인 rate limit 기본값은 IP 기준 5회/분이다. 신뢰되지 않은 `X-Forwarded-For`를 그대로 사용하지 않는다.

## 의존성과 보안

- Auth가 제품·카테고리·문의 Repository를 직접 참조하지 않게 한다.
- UI guard는 보안 경계가 아니다. 관리자 API의 최종 401/403 처리는 Spring Security가 담당한다.
- `allowCredentials=true`와 wildcard origin을 함께 사용하지 않는다.
- Spring Security의 CSRF를 disable하지 않는다.
- 인증 실패와 CSRF 실패는 HTML 기본 오류가 아니라 `docs/api-contract.md`의 JSON 형식으로 반환한다.
- 인증 설정 때문에 공개 visible 제품 조회까지 유효한 JWT를 요구하지 않게 경로 규칙을 검토한다.

## 구현 패턴

- 기존 `Admin`의 protected 기본 생성자, 정적 팩토리, quoted PostgreSQL 테이블/컬럼 매핑을 유지한다.
- JPA Entity를 API 응답으로 직접 반환하지 않는다.
- HTTP response와 cookie 조작을 서비스에 넣지 않는다.
- 예외 메시지에 credential이나 token 내용을 포함하지 않는다.
- 요청 범위 밖에서 기존 API method, path, 응답 필드를 변경하지 않는다.

## 테스트와 검증

- 누락 입력 400, 계정 없음/비밀번호 불일치 401, 성공 cookie 발급을 검증한다.
- JWT 정상·만료·변조·비 HS256·짧은 secret을 검증한다.
- CSRF 발급, CSRF 없는 로그인 403, 관리자 변경 API 403을 검증한다.
- logout cookie 속성과 verify의 200/401 경계를 검증한다.
- 실제 secret이나 운영 계정을 테스트에 사용하지 않는다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`, 특정 테스트는 `.\gradlew.bat test --tests "완전한.테스트클래스명"`으로 실행한다.

## 이번 구현 변경

- bcrypt 로그인, HS256 12시간 JWT 발급, `auth_token` HttpOnly 쿠키 발급·삭제를 구현했다.
- verify와 CSRF 발급 API 및 JWT claim 응답을 구현했다.
- 비밀번호/JWT/secret 원문은 로그에 남기지 않는다.
- 검증: Spring 컴파일 및 tester의 cookie/JWT/CSRF/rate-limit 테스트 대상이다.
- opt-in ApplicationRunner 관리자 bootstrap을 추가했으며 기존 username을 덮어쓰지 않고 bcrypt hash만 저장한다.
- bootstrap 로그에는 username만 허용하고 password/hash/DB 정보는 출력하지 않는다.
- 로그인/로그아웃 메시지를 API 계약의 `로그인 성공` / `Logged out`으로 고정하고 통합 테스트로 검증한다.
- tester: CSRF 발급·거부, 관리자 401, JWT HttpOnly cookie 로그인/verify, 잘못된 cookie가 있는 공개 API 계약 테스트를 추가했다.
- tester: 잘못된 `auth_token`이 있는 공개 제품 조회가 401이 되는 명세 위반을 재현했다.
