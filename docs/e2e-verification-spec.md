# E2E Verification Spec

작성일: 2026-05-31

## 목표

Spring Boot 전환이 실제 사용자 흐름 기준으로 완료되었는지 판정한다.

이 문서는 구현 명세가 아니라 완료 판정 명세다. 각 항목은 화면 동작, API status, 응답 JSON, 쿠키 상태, Next.js 서버 의존성 제거 여부를 기준으로 통과/실패를 판단한다.

## 범위

검증 대상:

```text
공개 제품 목록 조회
제품 상세 조회
제품 검색
카테고리별 제품 조회
문의 등록
메일 실패 시 inquirySaved=true 처리
관리자 로그인
새로고침 후 인증 유지
관리자 제품 등록/수정/삭제
카테고리 추가/삭제
문의 목록/삭제
로그아웃
로그아웃 후 관리자 API 401
Next.js Prisma import 제거
Next.js API Route 제거
```

검증 제외:

```text
디자인 리뉴얼
성능 부하 테스트
브라우저 호환성 전체 매트릭스
메일 템플릿 디자인 품질
운영 DB 마이그레이션
```

## 사전 조건

로컬 실행:

```text
Next.js: http://localhost:3000
Spring Boot: http://localhost:8080
```

필수 환경 변수:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
SERVER_API_BASE_URL=http://localhost:8080
FRONTEND_ORIGIN=http://localhost:3000
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

메일 검증 시:

```text
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
MAIL_TO
MAIL_HOST
MAIL_PORT
```

브라우저 조건:

```text
시크릿 창 또는 쿠키 삭제 상태에서 시작
DevTools Network/Application 탭 사용 가능
```

## 공통 판정 기준

API 응답:

```text
2xx/4xx/5xx status가 계약과 일치해야 한다.
success 필드가 계약과 일치해야 한다.
응답 JSON 필드명이 기존 프론트 기대와 일치해야 한다.
날짜는 2026-05-27T10:00:00.000Z 형태의 문자열이어야 한다.
날짜는 DB timestamp를 UTC로 간주해 변환한 값이어야 하며 서버 로컬 타임존 영향을 받으면 안 된다.
```

쿠키:

```text
로그인 성공 시 auth_token 저장
auth_token은 HttpOnly
logout 후 auth_token 삭제
관리자 API 요청에 Cookie 포함
```

보안:

```text
공개 API는 인증 없이 동작
관리자 API는 인증 없으면 401
숨김 제품은 공개 목록/검색/카테고리 목록/sitemap에 노출 금지
```

## 공개 사용자 플로우

### 1. 공개 제품 목록 조회

화면:

```text
/products
```

기대 API:

```text
GET /api/products
```

통과 기준:

```text
200 OK
success=true
products 배열 존재
각 product에 id, name, categoryId, category, companyId, spec, description, imageUrl, isVisible, createdAt, updatedAt 포함
isVisible=false 제품이 보이지 않음
Network 탭에서 Spring API origin 호출
```

실패 기준:

```text
Next.js /api/products 호출
숨김 제품 노출
category가 객체로 내려옴
companyId 누락
```

### 2. 제품 상세 조회

화면:

```text
/products/{id}
```

기대 API:

```text
GET /api/products/{id}
```

통과 기준:

```text
200 OK
success=true
product 객체 존재
category는 문자열
companyId 최상위 포함
존재하지 않는 id는 404
숨김 제품 상세는 공개 접근으로 노출되지 않음
```

### 3. 제품 검색

화면:

```text
검색 UI
```

기대 API:

```text
GET /api/products/search?q={query}
```

통과 기준:

```text
200 OK
success=true
products 배열
빈 q는 products=[]
최대 10개
isVisible=true만 반환
대소문자 무시 검색
```

### 4. 카테고리별 제품 조회

화면:

```text
/products/category/{id}
```

기대 API:

```text
GET /api/categories/{id}
GET /api/products?categoryId={id}
```

통과 기준:

```text
카테고리 id가 존재하면 200
없는 카테고리는 404
제품 목록은 해당 categoryId만 포함
isVisible=false 제품 제외
GET /api/categories 무파라미터 호출이 없음
GET /api/categories 무파라미터를 직접 호출하면 400
```

### 5. 메인 featured 제품 조회

화면:

```text
/
```

기대 API:

```text
GET /api/products/featured?limit=4
```

통과 기준:

```text
200 OK
최대 4개
createdAt desc
isVisible=true만 반환
Next.js가 Prisma로 직접 조회하지 않음
```

### 6. 문의 등록

화면:

```text
/contact
```

기대 API:

```text
POST /api/inquiries
```

통과 기준:

```text
201 Created
success=true
stage=DONE
mailSent=true
inquiry 객체 포함
email 미입력 또는 blank여도 저장 가능
사용자에게 접수 성공 안내
```

검증 실패 케이스:

```text
name 누락 → 400 VALIDATION_FAILED
phone/phoneNumber 누락 → 400 VALIDATION_FAILED
content/message 누락 → 400 VALIDATION_FAILED
```

### 7. 메일 실패 처리

조건:

```text
SMTP mock 실패 또는 잘못된 메일 설정으로 MailService 실패 유도
```

기대 API:

```text
POST /api/inquiries
```

통과 기준:

```text
502 Bad Gateway
success=false
errorCode=MAIL_SEND_FAILED
stage=MAIL_SEND
inquirySaved=true
inquiryId 존재
mailError 존재
프론트는 문의 접수 성공으로 안내
DB에 문의가 저장되어 있음
```

실패 기준:

```text
메일 실패 때문에 문의 저장이 rollback됨
inquirySaved가 false 또는 누락됨
프론트가 사용자에게 단순 실패로만 안내
```

## 관리자 인증 플로우

### 8. 관리자 로그인

화면:

```text
/admin/login
```

기대 API:

```text
POST /api/auth/login
```

통과 기준:

```text
200 OK
success=true
message="로그인 성공"
Set-Cookie auth_token 존재
auth_token HttpOnly
로그인 후 /admin 접근 가능
```

실패 케이스:

```text
잘못된 계정 → 401
username/password 누락 → 400
```

### 9. 새로고침 후 인증 유지

화면:

```text
/admin
```

기대 API:

```text
GET /api/auth/verify
```

통과 기준:

```text
새로고침 후 /admin 유지
verify 200
response user.id, username, iat, exp 포함
Next.js /admin guard는 Spring verify 기준으로 판단
Next.js가 JWT_SECRET으로 직접 검증하지 않음
```

실패 기준:

```text
새로고침 시 /admin/login으로 튕김
verify 호출 없이 JWT_SECRET 직접 검증에 의존
```

### 10. 로그아웃

화면:

```text
/admin
```

기대 API:

```text
GET /api/auth/logout
```

통과 기준:

```text
200 OK
success=true
message="Logged out"
auth_token 삭제
/admin/login으로 이동
```

실패 기준:

```text
POST /api/auth/logout 사용
쿠키 삭제 실패
로그아웃 후 verify가 200
```

### 11. 로그아웃 후 관리자 API 401

검증 API:

```text
GET /api/auth/verify
GET /api/products?includeHidden=true
POST /api/products
POST /api/categories
GET /api/inquiries
```

통과 기준:

```text
모두 401 Unauthorized
success=false
인증 필요 또는 세션 만료 메시지
```

실패 기준:

```text
로그아웃 후 관리자 API가 200/201/204로 성공
```

## 관리자 기능 플로우

### 12. 관리자 제품 등록

기대 API:

```text
POST /api/products
```

통과 기준:

```text
201 Created
success=true
message="제품이 성공적으로 등록되었습니다."
product가 ProductResponse 전체 필드 포함
생성 직후 isVisible=true
목록 재조회 시 표시
```

실패 케이스:

```text
name/categoryId/spec 누락 → 400
없는 categoryId → 404
인증 없음 → 401
```

### 13. 관리자 제품 수정

기대 API:

```text
PATCH /api/products/{id}
```

통과 기준:

```text
200 OK
success=true
message="제품 정보가 수정되었습니다."
product가 ProductResponse 전체 필드 포함
updatedAt 변경
isVisible false로 바꾸면 공개 목록에서 사라짐
```

### 14. 관리자 제품 삭제

기대 API:

```text
DELETE /api/products/{id}
```

통과 기준:

```text
200 OK
success=true
message="제품이 삭제되었습니다."
목록 재조회 시 삭제된 제품 없음
없는 id 삭제 시 404
```

주의:

```text
운영 검증에서는 실제 운영 데이터 삭제 금지
테스트 전용 TEST_ 제품만 삭제
```

### 15. 카테고리 추가

기대 API:

```text
POST /api/categories
```

통과 기준:

```text
201 Created
success=true
message="카테고리가 추가되었습니다."
category 객체 포함
name + companyId 중복이면 409
```

### 16. 카테고리 삭제

기대 API:

```text
DELETE /api/categories?id={id}
```

통과 기준:

```text
제품이 연결되지 않은 카테고리 삭제 성공
success=true
message="카테고리가 삭제되었습니다."
제품이 연결된 카테고리는 400
```

주의:

```text
테스트 전용 TEST_ 카테고리만 삭제
기존 seed 카테고리 삭제 금지
```

### 17. 문의 목록 조회

기대 API:

```text
GET /api/inquiries
```

통과 기준:

```text
200 OK
success=true
inquiries 배열
createdAt desc
관리자 인증 없으면 401
```

### 18. 문의 삭제

기대 API:

```text
DELETE /api/inquiries/{id}
```

통과 기준:

```text
200 OK
success=true
message="문의 내역이 삭제되었습니다."
목록 재조회 시 삭제된 문의 없음
없는 id는 404 또는 계약된 실패 응답
```

주의:

```text
테스트가 생성한 TEST_ 문의만 삭제
기존 문의 데이터 삭제 금지
```

## Next.js 분리 완료 검증

### 19. Prisma import 없음

명령:

```powershell
rg "prisma|@prisma/client|@/lib/prisma" src package.json
```

통과 기준:

```text
src에서 Prisma import 없음
package.json build script에 prisma generate 없음
@prisma/client 의존성 없음
prisma devDependency 없음
Next.js 런타임에 DATABASE_URL 필요 없음
```

허용 예외:

```text
전환 완료 전 보관 문서나 백업 branch는 검증 대상 아님
```

### 20. Next.js API Route 없음

명령:

```powershell
Test-Path src/app/api
```

통과 기준:

```text
False
```

추가 검색:

```powershell
rg "src/app/api|/api/auth/login/route|/api/products/route" src
```

통과 기준:

```text
Next.js API Route 파일 없음
브라우저 Network에서 Spring origin으로 API 호출
```

### 21. fetch 상대 경로 잔여 없음

명령:

```powershell
rg "fetch\\('/api|fetch\\(`/api" src
```

통과 기준:

```text
직접 상대 경로 fetch 없음
src/lib/api/client.ts를 통해 Spring API 호출
```

## SEO/메타 데이터 검증

### 22. sitemap 생성

기대 API:

```text
GET /api/sitemap-data
```

통과 기준:

```text
sitemap.ts가 Prisma 없이 URL 생성
숨김 제품 URL 제외
제품 updatedAt 반영
카테고리 URL 포함
```

### 23. 제품 상세 metadata

기대 API:

```text
GET /api/products/{id}
```

통과 기준:

```text
제품 상세 페이지 metadata가 Prisma 없이 생성
없는 제품은 notFound 처리
숨김 제품은 공개 metadata 생성 안 함
```

### 24. 카테고리 metadata

기대 API:

```text
GET /api/categories/{id}
```

통과 기준:

```text
카테고리 페이지 metadata가 Prisma 없이 생성
없는 카테고리는 notFound 처리
```

## 빌드/실행 검증

Next.js:

```powershell
npm run build
```

Spring Boot:

```powershell
.\gradlew test
.\gradlew bootRun --args='--spring.profiles.active=local'
```

통과 기준:

```text
Next.js build 성공
Spring test 성공
Spring local 실행 성공
브라우저에서 주요 플로우 통과
```

## 데이터 보호 기준

```text
운영 DB 스키마 변경 없음
운영 테스트에서 실제 제품/카테고리/문의 삭제 금지
테스트 데이터는 TEST_ prefix 사용
기존 seed 데이터 수정/삭제 금지
```

## 최종 완료 기준

아래 조건을 모두 만족해야 전환 완료로 판정한다.

```text
공개 제품 목록 조회 통과
제품 상세 조회 통과
제품 검색 통과
카테고리별 제품 조회 통과
문의 등록 통과
메일 실패 inquirySaved=true 처리 통과
관리자 로그인 통과
새로고침 후 인증 유지 통과
관리자 제품 등록/수정/삭제 통과
카테고리 추가/삭제 통과
문의 목록/삭제 통과
로그아웃 통과
로그아웃 후 관리자 API 401 통과
Next.js에서 Prisma import 없음
Next.js API Route 없음
Next.js build 성공
Spring test/build 성공
운영 DB 스키마 변경 없음
숨김 제품 공개 노출 없음
```

## 중단 기준

하나라도 발생하면 완료 판정 불가다.

```text
공개 화면에서 isVisible=false 제품 노출
관리자 API가 인증 없이 성공
문의 저장은 됐는데 프론트가 실패로만 안내
메일 실패 시 inquirySaved=true 누락
로그아웃 후 auth_token 유지
Next.js가 Prisma를 import
src/app/api가 남아 있음
Next.js build 실패
Spring test 실패
운영 DB 스키마 변경 감지
```
