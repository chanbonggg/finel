# Spring Boot 전환 추가 명세 필요 목록

작성일: 2026-05-30

상태: 2026-06-23 보완 완료. 이 문서는 과거 gap 분석 기록으로 보존하며 실제 구현은 `docs/spring-migration-decisions.md`와 `docs/migration-runbook.md`를 따른다.

## 전제

이번 전환의 목표는 Next.js를 제거하는 것이 아니다.

목표 구조는 다음과 같다.

```text
Frontend: Next.js
- 화면
- React 컴포넌트
- 관리자 UI
- 제품 목록/상세/검색
- 문의 폼

Backend: Spring Boot
- Auth API
- Product API
- Category API
- Inquiry API
- Mail Service
- PostgreSQL 접근

Database: PostgreSQL
```

즉, 현재 Next.js 안에 있는 API Route, Prisma, 서버 인증/메일/DB 처리 기능을 Spring Boot로 분리하고, Next.js는 프론트엔드 역할에 집중하도록 만든다.

현재 필요한 전환 명세는 모두 작성되어 Spring Boot 백엔드 구현을 시작할 수 있다.

다만 전체 전환을 안전하게 끝내려면 아래 명세를 추가로 작성해야 한다.

## 1. 프론트 API 전환 명세

파일명:

```text
docs/frontend-api-migration-spec.md
```

목적:

Next.js 화면에서 호출하던 `/api/...` 요청을 Spring Boot API로 안전하게 전환하는 기준을 정한다.

정해야 할 내용:

```text
NEXT_PUBLIC_API_BASE_URL 사용 방식
src/lib/api/client.ts 생성 여부
도메인별 API 클라이언트 파일 구조
fetch('/api/...') 치환 규칙
credentials: 'include' 적용 기준
관리자 API 호출 방식
공개 API 호출 방식
공통 에러 응답 처리 방식
```

특히 확인할 부분:

```text
현재 관리자 제품 목록은 /api/products를 호출한다.
Spring 전환 명세에서는 관리자 전체 목록을 /api/products?includeHidden=true로 구분하려고 한다.
이 차이를 프론트 전환 명세에서 확정해야 한다.
```

## 2. Prisma 직접 사용 제거 명세

파일명:

```text
docs/next-prisma-removal-spec.md
```

목적:

Next.js가 DB에 직접 접근하지 않도록 Prisma 사용 지점을 Spring API 호출로 대체한다.

정해야 할 내용:

```text
Next.js에서 Prisma를 직접 import하는 파일 목록
각 파일을 어떤 Spring API로 대체할지
추가로 필요한 공개 API
src/lib/prisma.ts 제거 조건
prisma/ 폴더 제거 조건
Prisma 관련 package.json 의존성 제거 조건
```

추가 API 후보:

```text
GET /api/categories/{id}
GET /api/products/featured?limit=4
GET /api/sitemap-data
```

주의:

`src/app/api`만 제거해도 Next.js가 Prisma를 직접 쓰고 있으면 백엔드 분리가 끝난 것이 아니다.

## 3. 환경 변수, CORS, 쿠키 명세

파일명:

```text
docs/env-cors-cookie-spec.md
```

목적:

Next.js와 Spring Boot가 서로 다른 서버로 실행될 때 인증 쿠키와 CORS가 깨지지 않도록 환경별 규칙을 확정한다.

정해야 할 내용:

```text
로컬 Next.js 주소
로컬 Spring Boot 주소
운영 Frontend origin
운영 Backend origin
NEXT_PUBLIC_API_BASE_URL
FRONTEND_ORIGIN
JWT_SECRET 필수 시점
MAIL_* 환경 변수
DATABASE 관련 환경 변수
```

쿠키 정책:

```text
local:
SameSite=Lax
Secure=false
Domain 미설정

production same-site:
SameSite=Lax
Secure=true
Domain 필요 여부 확정

production cross-site:
정식 지원하지 않음
same-site custom domain 또는 same-origin reverse proxy로 변경
```

주의:

관리자 로그인은 CORS, credentials, SameSite, Secure 설정 중 하나만 틀려도 깨질 수 있다.

## 4. 전환 실행 순서 명세

파일명:

```text
docs/migration-runbook.md
```

목적:

Spring 구현, Next.js 호출 전환, Next.js API 제거를 어떤 순서로 진행할지 실행 절차를 정한다.

권장 순서:

```text
1. Spring Boot 공개 API 구현
2. Spring Boot 문의 등록 API 구현
3. Spring Boot 인증 API 구현
4. Spring Boot 관리자 API 구현
5. Next.js 일부 화면을 Spring API로 연결
6. 관리자 화면을 Spring API로 연결
7. Prisma 직접 사용 제거
8. Next.js API Route 제거
9. 배포 환경 변수와 CORS/Cookie 설정 반영
10. 최종 검증
```

각 단계마다 필요한 항목:

```text
시작 조건
작업 범위
검증 방법
되돌리는 방법
완료 기준
```

## 5. Next.js API 제거 명세

파일명:

```text
docs/next-api-removal-spec.md
```

목적:

Spring API 전환이 끝난 뒤 Next.js API Route와 서버 전용 코드를 안전하게 제거한다.

정해야 할 내용:

```text
src/app/api 제거 조건
src/lib/admin-auth.ts 제거 조건
src/proxy.ts 유지/삭제 범위
src/lib/prisma.ts 제거 조건
Next.js middleware/proxy 역할 대체 여부
Prisma 의존성 제거 범위
삭제 후 빌드 검증 기준
```

주의:

Next.js의 `src/proxy.ts`가 관리자 보호를 담당하고 있으므로, Spring Security 전환이 끝나기 전에 제거하면 안 된다.

## 6. E2E 검증 명세

파일명:

```text
docs/e2e-verification-spec.md
```

목적:

전환 후 사용자가 실제로 쓰는 흐름이 기존과 동일하게 동작하는지 확인한다.

최소 검증 플로우:

```text
사용자 제품 목록 조회
사용자 제품 상세 조회
제품 검색
카테고리별 제품 조회
문의 등록
관리자 로그인
새로고침 후 인증 유지
제품 등록
제품 수정
제품 삭제
카테고리 추가
카테고리 삭제
문의 목록 조회
문의 삭제
로그아웃
로그아웃 후 관리자 API 접근 차단
```

검증 기준:

```text
응답 status code
응답 JSON 형태
화면 표시 결과
쿠키 저장/삭제 여부
숨김 제품 노출 여부
메일 성공/실패 처리
```

## 우선순위

가장 먼저 작성할 문서:

```text
1. docs/frontend-api-migration-spec.md
2. docs/next-prisma-removal-spec.md
3. docs/env-cors-cookie-spec.md
4. docs/migration-runbook.md
```

그 다음 작성할 문서:

```text
5. docs/next-api-removal-spec.md
6. docs/e2e-verification-spec.md
```

## 현재 명세로 가능한 작업

현재 문서만으로도 가능한 작업:

```text
Spring Boot 프로젝트 뼈대 생성
JPA Entity 작성
Repository 작성
공개 Product API 구현
Category API 구현
Inquiry API 구현
MailService 구현
Auth API 구현
관리자 Product/Category/Inquiry API 구현
```

현재 문서만으로는 부족한 작업:

```text
Next.js 화면 전체를 Spring API로 안전하게 전환
Next.js의 Prisma 직접 접근 완전 제거
Next.js API Route 삭제
운영 CORS/Cookie 설정 확정
배포 전환 절차 확정
최종 E2E 검증
```

## 결론

Spring Boot 백엔드 구현을 시작해도 된다.

프론트 전환, Prisma 제거, Next.js API Route 제거, CORS/Cookie/CSRF, E2E, DB migration 소유권 명세가 작성되었다. 구현 중 선택지가 다시 생기면 러프 플랜에 직접 추가하지 않고 `docs/spring-migration-decisions.md`에 결정 기록을 추가한다.
