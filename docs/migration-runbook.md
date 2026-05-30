# Spring Boot Migration Runbook

작성일: 2026-05-31

이 문서의 단계 번호를 master migration sequence로 사용한다. 다른 문서의 “2단계 skeleton”, “3단계 DB 모델” 같은 이름은 기존 작성 순서를 나타내는 준비 명세명이며, 실제 실행 순서는 이 문서의 master sequence를 따른다.

## 목표

Next.js API Route와 Prisma 기반 서버 기능을 Spring Boot로 이전하는 실행 순서를 정의한다.

이 문서는 구현자가 어떤 순서로 작업하고, 각 단계에서 무엇을 검증하고, 문제가 생기면 어떻게 되돌릴지 판단하기 위한 운영 절차서다.

## 전체 원칙

```text
기존 프론트 동작을 먼저 유지한다.
운영 DB 스키마를 변경하지 않는다.
API path와 response shape을 최대한 유지한다.
한 번에 모든 API를 바꾸지 않고 공개 API부터 전환한다.
각 단계 완료 전 다음 단계로 넘어가지 않는다.
```

## 단계 요약

```text
1. Spring Boot 공개 API 구현
2. Spring Boot 문의 등록 API 구현
3. Spring Boot 인증 API 구현
4. Spring Boot 관리자 API 구현
5. Next.js 공개 화면 Spring API 연결
6. 관리자 화면 Spring API 연결
7. Prisma 직접 사용 제거
8. Next.js API Route 제거
9. 배포 환경 변수/CORS/Cookie 반영
10. 최종 검증
```

준비 명세와의 관계:

```text
docs/spring-boot-step2-skeleton-spec.md: master sequence 시작 전 준비 산출물
docs/spring-boot-step3-db-model-implementation-spec.md: master sequence 1단계 시작 조건
docs/admin-bootstrap-spec.md: master sequence 7~8단계 전 완료 필요
docs/e2e-verification-spec.md: master sequence 10단계 완료 판정 기준
```

## 1단계: Spring Boot 공개 API 구현

시작 조건:

```text
backend skeleton 생성 완료
JPA Entity/Repository validate 통과
GET /api/products 공개 목록 정책 확정
GET /api/categories?companyId= companyId 필수 정책 확정
```

작업 범위:

```text
GET /api/products
GET /api/products/{id}
GET /api/products/search?q=
GET /api/categories?companyId=
```

검증:

```text
GET /api/products가 isVisible=true만 반환
GET /api/products/search?q=가 최대 10개 반환
GET /api/categories without companyId가 400 반환
응답 JSON이 docs/api-contract.md와 일치
```

되돌리는 방법:

```text
프론트는 아직 Next.js API Route를 사용하므로 Spring 공개 API만 롤백 또는 비활성화
DB 변경 없음 확인
```

완료 기준:

```text
공개 API 4개가 로컬에서 200/400/404 계약대로 동작한다.
운영 DB 스키마 변경이 없다.
```

## 2단계: Spring Boot 문의 등록 API 구현

시작 조건:

```text
Inquiry Entity/Repository 저장 검증 완료
MailService mock 테스트 가능
문의 email optional 저장 정책 확정
```

작업 범위:

```text
POST /api/inquiries
MailService 연동
VALIDATION_FAILED/DB_WRITE_FAILED/MAIL_SEND_FAILED 응답 구현
```

검증:

```text
필수값 누락 400
email 누락 시 "" 저장
메일 성공 201 + mailSent=true + inquiry 반환
메일 실패 502 + inquirySaved=true
DB 실패 시 inquirySaved=false
```

되돌리는 방법:

```text
프론트 문의 폼을 기존 Next.js API Route로 유지
Spring 문의 API 배포 제외
```

완료 기준:

```text
문의 저장과 메일 실패 처리가 분리되어 있다.
기존 프론트가 inquirySaved=true를 성공으로 처리할 수 있다.
```

## 3단계: Spring Boot 인증 API 구현

시작 조건:

```text
AdminRepository.findByUsername 동작
JWT_SECRET 설정
CORS/Cookie 로컬 정책 설정
```

작업 범위:

```text
POST /api/auth/login
GET /api/auth/logout
GET /api/auth/verify
SecurityConfig
CorsConfig
auth_token cookie 발급/삭제
```

검증:

```text
로그인 성공 200 + Set-Cookie
로그인 실패 401
verify 성공 user.id/username/iat/exp 반환
logout은 GET 유지
logout 후 verify 401
```

되돌리는 방법:

```text
관리자 화면은 기존 Next.js auth API 유지
Spring Security 보호 설정을 공개 API에 영향 주지 않게 분리
```

완료 기준:

```text
로컬 cross-origin에서 credentials 포함 요청이 인증을 유지한다.
쿠키 삭제가 정상 동작한다.
```

## 4단계: Spring Boot 관리자 API 구현

시작 조건:

```text
인증 API 완료
관리자 API 보호 필터 적용 가능
ProductReader/CategoryReader 경계 확정
```

작업 범위:

```text
GET /api/products?includeHidden=true
POST /api/products
PATCH /api/products/{id}
DELETE /api/products/{id}
POST /api/categories
DELETE /api/categories?id=
GET /api/inquiries
DELETE /api/inquiries/{id}
```

검증:

```text
인증 없음 401
토큰 만료/변조 401
관리자 제품 목록은 숨김 포함
공개 제품 목록은 숨김 제외
제품 연결 카테고리 삭제 400
문의 삭제 메시지 일치
```

되돌리는 방법:

```text
프론트 관리자 훅을 기존 Next.js API Route로 유지
Spring 관리자 API만 배포 제외 또는 route 차단
```

완료 기준:

```text
관리자 API가 기존 응답 형태로 동작한다.
권한 없는 요청이 모두 차단된다.
```

## 5단계: Next.js 공개 화면 Spring API 연결

시작 조건:

```text
Spring 공개 API 배포 또는 로컬 실행 완료
NEXT_PUBLIC_API_BASE_URL 설정
src/lib/api/client.ts 준비
```

작업 범위:

```text
src/app/products/page.tsx
src/components/ProductSearch.tsx
src/app/contact/page.tsx 제품 선택 목록
```

검증:

```text
제품 목록 렌더링
검색 동작
문의 폼 제품 select 동작
Network 탭에서 Spring API 호출 확인
```

되돌리는 방법:

```text
API client 호출을 기존 /api 상대 경로로 되돌림
NEXT_PUBLIC_API_BASE_URL 제거 또는 빈 값 처리
```

완료 기준:

```text
공개 화면이 Next.js API Route 없이 Spring API로 동작한다.
```

## 6단계: 관리자 화면 Spring API 연결

시작 조건:

```text
Spring 인증/관리자 API 완료
env-cors-cookie-spec 로컬 검증 완료
```

작업 범위:

```text
src/app/admin/login/page.tsx
src/app/admin/page.tsx
src/hooks/useProductAdmin.ts
src/hooks/useInquiry.ts
```

필수 변경:

```text
관리자 제품 목록: GET /api/products?includeHidden=true
모든 관리자 API: credentials include
logout: GET /api/auth/logout
```

검증:

```text
로그인
새로고침 후 인증 유지
제품 등록/수정/삭제
카테고리 추가/삭제
문의 목록/삭제
로그아웃 후 관리자 API 401
```

되돌리는 방법:

```text
관리자 API client만 기존 Next.js API로 되돌림
Spring 관리자 API 배포는 유지 가능
```

완료 기준:

```text
관리자 UI 모든 기능이 Spring API 기반으로 동작한다.
```

## 7단계: Prisma 직접 사용 제거

시작 조건:

```text
Next.js API 호출 전환 완료
직접 Prisma 대체 API 확정
docs/admin-bootstrap-spec.md 기준 관리자 계정 bootstrap 절차 확정
```

작업 범위:

```text
src/app/page.tsx
src/app/products/[id]/page.tsx
src/app/products/category/[id]/page.tsx
src/app/sitemap.ts
```

검증:

```powershell
rg "prisma|@prisma/client|@/lib/prisma" src
```

되돌리는 방법:

```text
해당 서버 컴포넌트만 Prisma 조회로 복구
src/lib/prisma.ts와 Prisma 의존성은 아직 보존
```

완료 기준:

```text
Next.js 화면/metadata/sitemap에서 Prisma import가 없다.
Prisma seed 제거 전 관리자 계정 생성 절차가 검증되어 있다.
```

## 8단계: Next.js API Route 제거

시작 조건:

```text
프론트 API 호출이 Spring API로 전환됨
Prisma 직접 사용 제거 완료
E2E 주요 플로우 통과
```

작업 범위:

```text
src/app/api 삭제
src/proxy.ts를 Spring verify 기반 /admin guard로 전환
src/lib/admin-auth.ts 제거 또는 미사용 처리
```

검증:

```powershell
Get-ChildItem -Recurse src/app/api
rg "/api/products|/api/categories|/api/inquiries|/api/auth" src
npm run build
```

되돌리는 방법:

```text
삭제 전 커밋으로 src/app/api 복구
프론트 API client base URL을 빈 값 또는 기존 경로로 복구
```

완료 기준:

```text
src/app/api가 없어도 Next.js build와 주요 화면이 동작한다.
/admin 접근 보호가 Spring GET /api/auth/verify 기준으로 동작한다.
Next.js 런타임에 JWT_SECRET이 필수가 아니다.
```

## 9단계: 배포 환경 변수/CORS/Cookie 반영

시작 조건:

```text
로컬 전환 검증 완료
운영 frontend/backend origin 확정
```

작업 범위:

```text
NEXT_PUBLIC_API_BASE_URL
FRONTEND_ORIGIN
DB_URL/DB_USERNAME/DB_PASSWORD
JWT_SECRET
MAIL_* 변수
Cookie SameSite/Secure/Domain
CORS allowedOrigins
```

검증:

```text
운영 로그인 Set-Cookie 확인
운영 관리자 API Cookie 전송 확인
logout 후 Cookie 삭제 확인
public API CORS 정상
```

되돌리는 방법:

```text
프론트 배포를 이전 환경 변수로 롤백
백엔드 배포를 이전 revision으로 롤백
DB 스키마 변경이 없으므로 데이터 롤백은 원칙적으로 불필요
```

완료 기준:

```text
운영에서 로그인/관리자 API/로그아웃이 동작한다.
allowedOrigins에 wildcard가 없다.
```

## 10단계: 최종 검증

필수 플로우:

```text
사용자 제품 목록 조회
제품 상세 조회
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

최종 검색:

```powershell
rg "prisma|@prisma/client|@/lib/prisma" src package.json
rg "fetch\\('/api|fetch\\(`/api" src
```

완료 기준:

```text
npm run build 성공
Spring backend build/test 성공
기존 프론트 동작이 깨지지 않음
지정한 API 응답 형태가 계약과 일치
운영 DB 스키마가 변경되지 않음
```

## 중단 기준

다음 중 하나라도 발생하면 다음 단계로 넘어가지 않는다.

```text
운영 DB 스키마 변경 감지
공개 페이지에 숨김 제품 노출
관리자 로그인 쿠키 저장 실패
문의 등록 저장 실패
관리자 API가 인증 없이 성공
Next.js build 실패
```

## 이번 단계에서 하지 않을 일

```text
운영 DB 마이그레이션
Prisma 즉시 삭제
대규모 UI 개편
인증 방식 Bearer token 전환
검색/페이지네이션 대규모 재설계
```
