# Spring Boot 전환 러프 플랜

작성일: 2026-05-28

## 목표

현재 `finel` 프로젝트는 Next.js 안에 화면과 API가 함께 있는 구조다.

이번 리팩토링의 목표는 전체 구조를 천천히 정리하면서 백엔드 API를 Spring Boot로 분리하고, Next.js는 프론트엔드 역할에 집중하도록 바꾸는 것이다.

## 현재 구조 요약

```text
Next.js
├─ 화면: src/app, src/components
├─ API: src/app/api
├─ 인증 보호: src/proxy.ts
├─ DB 접근: Prisma
└─ DB: PostgreSQL
```

현재는 Python 서버가 아니라 Next.js API Route 기반 서버다.

## 목표 구조

```text
Frontend: Next.js
├─ 사용자 페이지
├─ 제품 목록/상세/검색 UI
├─ 문의 폼
└─ 관리자 UI

Backend: Spring Boot
├─ Auth API
├─ Product API
├─ Category API
├─ Inquiry API
├─ Mail Service
└─ PostgreSQL 연결

Database: PostgreSQL
```

## 큰 방향

처음부터 한 번에 갈아엎지 않는다.

1. 현재 기능을 기준으로 API 목록을 정리한다.
2. Spring Boot 백엔드를 별도 프로젝트로 만든다.
3. DB 모델을 Prisma schema 기준으로 JPA Entity로 옮긴다.
4. 제품/카테고리/문의 API를 Spring에서 하나씩 구현한다.
5. Next.js 화면의 `fetch('/api/...')` 호출을 Spring API 주소로 하나씩 바꾼다.
6. 모든 API가 넘어가면 Next.js의 `src/app/api`를 제거한다.
7. 인증, 배포, 환경 변수를 최종 정리한다.

## 이전 대상 API

### 인증

현재:

```text
src/app/api/auth/login
src/app/api/auth/logout
src/app/api/auth/verify
src/proxy.ts
src/lib/admin-auth.ts
```

Spring 전환 후:

```text
POST /api/auth/login
GET  /api/auth/logout
GET  /api/auth/verify
```

해야 할 일:

- 관리자 로그인
- bcrypt 비밀번호 검증
- JWT 발급
- httpOnly 쿠키 저장 방식 유지 여부 결정
- 관리자 API 보호 처리

### 제품

현재:

```text
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PATCH  /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q=
```

Spring 전환 후에도 같은 URL 형태를 유지하는 것이 가장 안전하다.

해야 할 일:

- 공개 제품 목록은 `isVisible=true`만 반환
- 관리자 제품 전체 목록은 `GET /api/products?includeHidden=true`로 분리하고 관리자 인증 필요
- 제품 상세
- 제품 등록
- 제품 수정
- 제품 삭제
- 제품 검색
- 카테고리명과 `companyId`를 포함한 응답 DTO 설계

### 카테고리

현재:

```text
GET    /api/categories?companyId=
POST   /api/categories
DELETE /api/categories?id=
```

해야 할 일:

- 회사별 카테고리 조회
- 카테고리 생성
- 제품이 연결된 카테고리 삭제 방지
- `name + companyId` 중복 방지

### 문의

현재:

```text
GET    /api/inquiries
POST   /api/inquiries
DELETE /api/inquiries/{id}
```

해야 할 일:

- 고객 문의 등록은 공개 API로 유지
- 관리자 문의 목록 조회
- 관리자 문의 삭제
- 문의 저장 후 메일 발송
- 메일 실패 시에도 문의 저장 여부를 명확히 응답

## DB 모델 이전 방향

현재 Prisma 모델:

```text
Admin
Category
Product
Inquiry
```

Spring Boot에서는 대략 다음 구성으로 옮긴다.

```text
auth/
├─ AuthController
├─ AuthService
├─ Admin
├─ AdminRepository
└─ dto/

product/
├─ ProductController
├─ ProductService
├─ Product
├─ ProductRepository
├─ ProductReader
└─ dto/

category/
├─ CategoryController
├─ CategoryService
├─ Category
├─ CategoryRepository
├─ CategoryReader
└─ dto/

inquiry/
├─ InquiryController
├─ InquiryService
├─ Inquiry
├─ InquiryRepository
└─ dto/

mail/
├─ MailService
└─ MailProperties

common/
config/
```

패키지는 `docs/spring-boot-step2-skeleton-spec.md`의 도메인 단위 구조를 따른다. `entity/`, `repository/`, `service/`, `controller/` 같은 최상위 계층형 패키지는 만들지 않는다.

다른 도메인의 데이터가 필요하면 Repository를 직접 주입하지 않고 해당 도메인의 Service 또는 `ProductReader`, `CategoryReader` 같은 조회용 컴포넌트를 통해 접근한다.

## 프론트엔드 변경 방향

Next.js 화면은 일단 유지한다.

바꿀 부분은 API 호출 위치다.

현재:

```ts
fetch('/api/products')
```

전환 후:

```ts
fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`)
```

또는 API 클라이언트 파일을 만들어 한 곳에서 관리한다.

```text
src/lib/api/
├─ client.ts
├─ products.ts
├─ categories.ts
├─ inquiries.ts
└─ auth.ts
```

러프 단계에서는 화면 리디자인보다 API 분리 안정성을 우선한다.

## 인증 방향

선택지는 두 가지다.

### 1. 쿠키 기반 유지

장점:

- 현재 구조와 가장 비슷하다.
- 관리자 UI 변경이 적다.
- httpOnly 쿠키를 유지할 수 있다.

주의:

- CORS 설정 필요.
- 쿠키 정책은 환경별로 나눈다.
- 로컬은 `SameSite=Lax`, `Secure=false`, Domain 미설정으로 둔다.
- 운영 same-site 배포는 `SameSite=Lax`, `Secure=true`를 쓴다.
- 운영 cross-site 배포는 `SameSite=None`, `Secure=true`, credentials CORS를 함께 쓴다.
- `SameSite=Strict`는 프론트/백엔드가 다른 site일 때 관리자 인증을 깨뜨릴 수 있으므로 기본값으로 쓰지 않는다.

### 2. Bearer Token 방식

장점:

- 프론트/백엔드 분리 구조에서 단순하다.
- 모바일 앱 등 확장 시 편하다.

주의:

- 토큰 저장 위치를 신중히 정해야 한다.
- XSS 위험 관리가 더 중요해진다.

초기 전환은 쿠키 기반 유지가 더 자연스럽다.

## 배포 방향

처음에는 로컬에서 분리한다.

```text
Next.js:     http://localhost:3000
Spring Boot: http://localhost:8080
PostgreSQL:  기존 Neon 또는 로컬 DB
```

나중에 배포는 다음 중 하나로 정한다.

```text
Frontend: Vercel
Backend: Render / Fly.io / Railway / EC2 / ECS
Database: Neon PostgreSQL
```

운영 DB를 공유하고 있다면 마이그레이션 명령은 특히 조심해야 한다.

## Legacy Rough Sequence

주의:

```text
아래 단계표는 초기 러프 플랜이다.
현재 전체 실행 순서의 master sequence는 docs/migration-runbook.md를 따른다.
이 섹션의 번호를 실제 실행 단계 번호로 사용하지 않는다.
```

### 1단계: API 명세 정리

- 현재 API 요청/응답 형태 정리
- 관리자 인증 필요한 API 표시
- 프론트에서 호출하는 API 위치 확인

결과물:

```text
docs/api-contract.md
```

### 2단계: Spring Boot 뼈대 생성

- Java 21 또는 17 결정
- Spring Web
- Spring Data JPA
- Spring Security
- PostgreSQL Driver
- Validation
- Mail

결과물:

```text
backend/
```

또는 별도 저장소.

### 3단계: DB 모델 이전

- Prisma schema를 JPA Entity로 변환
- Repository 작성
- 로컬 DB 연결 확인

이 단계에서는 운영 DB 변경 없이 읽기/개발 환경부터 확인한다.

결과물:

```text
docs/spring-boot-step3-db-model-implementation-spec.md
```

### 4단계: 공개 API부터 이전

먼저 인증이 필요 없는 API부터 옮긴다.

- 제품 목록
- 제품 상세
- 제품 검색
- 카테고리 조회
- 문의 등록

### 5단계: 관리자 API 이전

- 로그인
- 제품 등록/수정/삭제
- 카테고리 추가/삭제
- 문의 목록/삭제

### 6단계: Next.js API 제거

Spring API 전환이 끝나면 제거한다.

```text
src/app/api
src/lib/prisma.ts
src/lib/admin-auth.ts
src/proxy.ts 일부 또는 전체
prisma/
```

단, 제거 전에는 모든 화면이 Spring API를 바라보는지 확인해야 한다.

### 7단계: 배포 정리

- Vercel 환경 변수 정리
- Spring 서버 환경 변수 정리
- CORS 허용 도메인 정리
- 쿠키 도메인/SameSite/Secure 설정 확인
- 운영 DB 마이그레이션 방식 확정

## 우선순위

1. 기능 유지
2. API 응답 형태 유지
3. DB 안전
4. 인증 안정성
5. 코드 구조 개선
6. 성능 최적화

처음부터 완벽한 구조를 만들기보다, 기존 동작을 그대로 옮긴 뒤 리팩토링하는 편이 안전하다.

## 당장 하지 않을 것

- 화면 전체 리디자인
- DB 스키마 대규모 변경
- 제품/문의 도메인 재설계
- 인증 방식 전면 교체
- 배포 자동화까지 한 번에 처리

## 리스크

- Next.js와 Spring의 쿠키/CORS 설정이 맞지 않으면 관리자 인증이 깨질 수 있다.
- Prisma와 JPA의 날짜/관계 처리 방식이 달라 응답 형태가 달라질 수 있다.
- 운영 DB를 그대로 사용하면 테스트 중 데이터가 바뀔 위험이 있다.
- 메일 발송 실패 처리 방식이 바뀌면 고객 문의 UX가 달라질 수 있다.

## 러프 결론

이 프로젝트는 Spring Boot로 전환 가능하다.

가장 현실적인 방향은 Next.js를 프론트엔드로 유지하고, 현재 `src/app/api`에 들어있는 서버 기능만 Spring Boot로 천천히 이전하는 것이다.

처음 단계에서는 새 기능을 만들기보다 API 계약과 DB 모델을 그대로 옮기는 데 집중한다.
