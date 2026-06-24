# Spring Boot 전환 확정 결정

작성일: 2026-06-23

## 목적

이 문서는 Spring Boot 전환 명세 사이에서 선택지로 남아 있던 항목을 확정한다. 다른 문서와 내용이 충돌하면 이 문서와 `docs/migration-runbook.md`를 우선한다.

## 1. 런타임과 빌드

```text
Java: 21 LTS
Spring Boot: 3.5.15
Build: Gradle Wrapper 8.14.5
Build DSL: Groovy
Packaging: executable Jar
Group: com.finel
Artifact: backend
Base package: com.finel.backend
```

- 개발 PC의 Microsoft OpenJDK 21을 그대로 사용할 수 있다.
- 전역 Gradle 설치에 의존하지 않고 `backend/gradlew`, `backend/gradlew.bat`만 사용한다.
- Spring Boot 4.x 업그레이드는 기능 동등성 전환 완료 후 별도 작업으로 진행한다.
- Java toolchain을 21로 고정해 개발, CI, 배포의 컴파일 버전을 일치시킨다.

## 2. 인증과 JWT

```text
인증 저장소: auth_token HttpOnly cookie
JWT algorithm: HS256
Access token lifetime: 12시간, 43,200초
Required claims: id, username, iat, exp
JWT secret: 최소 32바이트의 무작위 secret
JWT 구현: Spring Security OAuth2 Resource Server + Nimbus JOSE
```

- 브라우저 localStorage/sessionStorage에 JWT를 저장하지 않는다.
- Spring Security가 `auth_token` 쿠키에서 JWT를 읽도록 cookie 기반 resolver/filter를 구현한다.
- Auth 전환 배포 시 기존 Next.js 발급 토큰의 세션 유지를 보장하지 않는다. 기존 쿠키를 만료시키고 관리자가 한 번 다시 로그인하도록 한다.
- 비밀번호는 기존 bcrypt hash와 호환되는 `BCryptPasswordEncoder`로 검증한다.
- 비밀번호, JWT 원문, JWT secret은 로그에 남기지 않는다.

## 3. CSRF

쿠키 인증을 사용하므로 Spring Security CSRF 보호를 끄지 않는다.

```text
CSRF cookie: XSRF-TOKEN, HttpOnly=false
CSRF request header: X-XSRF-TOKEN
Token issue endpoint: GET /api/auth/csrf
```

- `GET /api/auth/csrf`는 공개 API이며 CSRF 토큰을 발급한다.
- 로그인과 관리자 변경 API의 POST/PATCH/DELETE 요청은 `X-XSRF-TOKEN`이 필수다.
- 인증 쿠키를 사용하지 않는 공개 `POST /api/inquiries`만 CSRF 검사에서 제외한다.
- 기존 호환을 위해 유지하는 `GET /api/auth/logout`은 CSRF 검사 대상이 아니며 세션 종료 외의 상태를 변경하지 않는다.
- CORS `allowedHeaders`에는 `Content-Type`, `X-XSRF-TOKEN`을 허용한다.
- CSRF 실패는 403과 공통 JSON 오류 응답을 반환한다.

## 4. 배포 토폴로지와 쿠키

운영 인증은 same-site 배포만 정식 지원한다.

권장:

```text
Frontend: https://www.finel.co.kr
Backend:  https://api.finel.co.kr
```

또는 Next.js reverse proxy를 통해 브라우저에는 같은 origin의 `/api`로 노출한다.

- 운영 쿠키는 `Secure=true`, `SameSite=Lax`를 사용한다.
- `Domain`은 기본적으로 설정하지 않는다. 공유가 반드시 필요할 때만 부모 도메인을 명시한다.
- `vercel.app`과 `onrender.com`처럼 서로 다른 site 조합은 서드파티 쿠키 차단 때문에 운영 지원 대상에서 제외한다.
- cross-site 배포가 불가피하면 인증 방식을 재설계하고 Safari/Chrome의 서드파티 쿠키 차단을 별도 검증한다.

## 5. DB와 시간

- 기존 Prisma/PostgreSQL 스키마를 JPA가 자동 변경하지 않는다.
- 전환 중 `ddl-auto=validate`, `open-in-view=false`를 사용한다.
- `update`, `create`, `create-drop`은 금지한다.
- Entity 시간은 현재 스키마 호환을 위해 `LocalDateTime`으로 매핑하되 생성은 UTC clock을 사용한다.
- Hibernate JDBC timezone과 애플리케이션 기본 timezone을 UTC로 고정한다.
- API DTO는 UTC `Instant`로 변환해 `...Z` ISO-8601 문자열을 반환한다.
- Prisma 제거 전 Flyway가 스키마 변경의 단일 소유자가 되도록 `docs/db-migration-ownership-spec.md`를 완료한다.

## 6. 문의 저장과 메일

- 문의 DB 저장 트랜잭션을 먼저 완료한다.
- 트랜잭션 커밋 후 메일을 동기 발송한다.
- 메일 실패가 저장 트랜잭션을 rollback하지 않도록 persistence service와 orchestration service를 분리한다.
- 메일 실패 응답은 `502`, `MAIL_SEND_FAILED`, `inquirySaved=true`, `inquiryId`를 유지한다.
- SMTP exception message, command, response code 같은 내부 정보는 응답에 포함하지 않고 서버 로그에만 남긴다.

## 7. 공개 API 동작 변경

다음은 단순 이전이 아니라 의도적인 보안/일관성 개선이다.

```text
GET /api/products: isVisible=true만 반환
GET /api/products/{id}: 숨김 제품은 404
GET /api/products?includeHidden=true: 관리자만 전체 반환
PATCH /api/products/{id}: 전체 ProductResponse 반환
카테고리 중복 생성: 409
공개 메일 실패 응답: SMTP 내부 상세 제거
```

## 8. 운영 보호

- 공개 문의 API와 로그인 API에는 운영 배포 전 rate limit을 적용한다.
- 최소 기준은 IP 기준 로그인 5회/분, 문의 3회/10분이며 배포 환경에 맞게 조정할 수 있다.
- rate limit 초과는 429를 반환한다.
- 운영 DB를 테스트 profile에 연결하지 않는다.
- 운영 데이터 삭제 E2E는 금지하고 `TEST_` fixture만 사용한다.

## 9. 완료 게이트

```text
backend/gradlew test 성공
backend/gradlew bootRun 로컬 실행 성공
npm run build 성공
npm run lint error 0
E2E 명세 전체 통과
Next.js Prisma import 없음
Next.js API Route 없음
Flyway 소유권 전환 절차 검증
운영 same-site 쿠키/CSRF 검증
```
