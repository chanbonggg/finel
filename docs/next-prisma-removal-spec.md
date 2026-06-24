# Next.js Prisma Removal Spec

작성일: 2026-05-31

참고: 전체 전환 실행 순서의 master sequence는 `docs/migration-runbook.md`를 따른다. 이 문서의 “제거 단계”는 Prisma 제거 작업 내부의 세부 순서이며 master sequence 번호를 대체하지 않는다.

## 목표

Next.js가 PostgreSQL에 직접 접근하지 않도록 Prisma 직접 사용을 제거한다.

이번 단계에서 해결할 문제는 Spring Boot가 DB 접근을 담당하도록 경계를 분리하는 것이다. 최종 상태에서 Next.js는 화면 렌더링과 Spring API 호출만 담당하고, Prisma Client와 `DATABASE_URL`에 의존하지 않아야 한다.

## 범위

이번에 할 일:

```text
Next.js의 Prisma import 사용처 식별
각 사용처를 Spring API 호출로 대체
필요한 추가 공개 API 정의
src/lib/prisma.ts 제거 조건 확정
prisma/ 폴더 제거 조건 확정
package.json Prisma 의존성 제거 조건 확정
```

이번에 하지 않을 일:

```text
Spring JPA Entity 재설계
운영 DB 스키마 변경
Prisma migration으로 DB 변경
SEO 정책 전면 변경
```

## 현재 Prisma 직접 사용처

프론트/서버 컴포넌트:

```text
src/app/page.tsx
src/app/products/[id]/page.tsx
src/app/products/category/[id]/page.tsx
src/app/sitemap.ts
```

Next.js API Route:

```text
src/app/api/auth/login/route.ts
src/app/api/categories/route.ts
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
src/app/api/products/search/route.ts
src/app/api/inquiries/route.ts
src/app/api/inquiries/[id]/route.ts
```

공통 Prisma 파일:

```text
src/lib/prisma.ts
```

Prisma 프로젝트 파일:

```text
prisma/schema.prisma
prisma/seed.js
```

package.json:

```text
build: prisma generate && next build
db:push
migrate:dev
migrate:deploy
prisma:generate
prisma:studio
@prisma/client
prisma
```

## 대체 API 매핑

| 현재 파일 | 현재 역할 | 대체 API |
| --- | --- | --- |
| `src/app/page.tsx` | 최신 공개 제품 4개 직접 조회 | `GET /api/products/featured?limit=4` |
| `src/app/products/[id]/page.tsx` | 제품 상세/metadata 직접 조회 | `GET /api/products/{id}` |
| `src/app/products/category/[id]/page.tsx` | 카테고리와 공개 제품 직접 조회 | `GET /api/categories/{id}` + `GET /api/products?categoryId={id}` |
| `src/app/sitemap.ts` | 제품/카테고리 URL 직접 조회 | `GET /api/sitemap-data` |
| `src/app/api/**` | DB 기반 API Route | Spring Boot API로 대체 후 삭제 |

## Prisma 제거용 정식 추가 API

다음 API는 후보가 아니라 Prisma 직접 사용 제거를 위한 정식 API 계약으로 승격한다.

### GET /api/products/featured?limit=4

목적:

```text
메인 페이지 최신 공개 제품 조회
```

정책:

```text
공개 API
isVisible=true만 반환
createdAt desc
limit 기본값 4, 최대 12
기존 products 응답 형태 유지
```

### GET /api/categories/{id}

목적:

```text
카테고리 상세/카테고리 페이지 metadata 조회
```

정책:

```text
공개 API
id 기준 Category 조회
없으면 404
```

### GET /api/products?categoryId={id}

목적:

```text
카테고리별 공개 제품 목록 조회
```

정책:

```text
공개 API
isVisible=true
categoryId 필터
createdAt desc
```

주의:

```text
기존 GET /api/products 공개 목록 계약과 충돌하지 않게 optional query로 확장한다.
관리자 전체 목록 includeHidden=true와 함께 쓰는 조합은 이번 범위에서 금지한다.
includeHidden=true와 categoryId가 함께 오면 400 Bad Request를 반환한다.
```

### GET /api/sitemap-data

목적:

```text
Next.js sitemap.ts가 DB 없이 URL 목록을 만들 수 있게 한다.
```

응답:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "updatedAt": "2026-05-27T10:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": 1
    }
  ]
}
```

## 제거 단계

### 1단계: API Route 대체 완료

조건:

```text
Spring Auth/Product/Category/Inquiry/Mail API 구현 완료
프론트 API 호출이 Spring API를 바라봄
관리자 인증이 Spring 쿠키로 동작
docs/admin-bootstrap-spec.md 기준 관리자 계정 bootstrap 절차 준비 완료
```

이 단계에서는 아직 Prisma 파일을 삭제하지 않는다.

### 2단계: 직접 Prisma 사용 화면 대체

대상:

```text
src/app/page.tsx
src/app/products/[id]/page.tsx
src/app/products/category/[id]/page.tsx
src/app/sitemap.ts
```

대체 기준:

```text
서버 컴포넌트에서도 Spring API를 호출한다.
metadata 생성도 Spring API 또는 정적 fallback을 사용한다.
API 장애 시 notFound 또는 안전한 fallback을 명시한다.
```

### 3단계: Next.js API Route 삭제

삭제 대상:

```text
src/app/api
```

삭제 조건:

```text
rg "fetch\\('/api|fetch\\(`/api" src 결과가 의도한 내부 route를 제외하고 없음
브라우저 Network에서 Spring origin으로 호출됨
관리자 기능 전체 검증 완료
```

### 4단계: Prisma Client 제거

삭제 대상:

```text
src/lib/prisma.ts
@prisma/client
prisma
prisma generate가 포함된 build script
db:push/migrate/prisma scripts
```

보류 가능:

```text
prisma/schema.prisma와 prisma/seed.js는 Spring JPA 이전 검증이 끝날 때까지 보관 가능
운영 DB seed를 Spring 또는 SQL bootstrap으로 대체하기 전에는 seed.js 삭제 금지
관리자 계정 bootstrap 기준은 docs/admin-bootstrap-spec.md를 따른다.
```

### 5단계: prisma/ 폴더 제거

삭제 조건:

```text
Spring JPA Entity가 운영 DB와 validate 통과
Spring 또는 SQL 기반 seed 방식이 확정됨
docs/admin-bootstrap-spec.md 기준 관리자 계정 생성 절차가 검증됨
운영/개발 DB 마이그레이션 체계가 Prisma 없이 확정됨
docs/db-migration-ownership-spec.md의 Flyway baseline 검증 완료
문서에서 Prisma를 현재 실행 도구로 참조하지 않음
```

## package.json 변경 기준

변경 전:

```json
{
  "build": "prisma generate && next build",
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0"
  }
}
```

변경 후:

```json
{
  "build": "next build"
}
```

주의:

```text
Prisma 제거 전 next build가 Prisma generate 없이 성공하는지 먼저 확인한다.
삭제 후 package-lock 또는 pnpm-lock도 함께 갱신한다.
```

## 검증 명령

Prisma import 잔여:

```powershell
rg "prisma|@prisma/client|@/lib/prisma" src package.json
```

Next.js API Route 잔여:

```powershell
Get-ChildItem -Recurse src/app/api
```

빌드:

```powershell
npm run build
```

Spring API 수동 검증:

```text
GET /api/products
GET /api/products/{id}
GET /api/products/search?q=test
GET /api/categories?companyId=1
POST /api/inquiries
POST /api/auth/login
GET /api/auth/verify
GET /api/auth/logout
```

## 리스크

```text
metadata와 sitemap은 서버 렌더링 시점에 Spring API 장애 영향을 받는다.
Prisma seed 제거 후 관리자 계정 생성 경로가 없으면 운영 초기화가 어려워진다. 제거 전 docs/admin-bootstrap-spec.md를 완료해야 한다.
제품 상세 페이지가 숨김 제품을 노출하지 않도록 Spring 정책과 프론트 notFound 처리를 맞춰야 한다.
```

## 완료 기준

```text
src에서 @/lib/prisma import가 없다.
Next.js build가 prisma generate 없이 성공한다.
Next.js 런타임에 DATABASE_URL이 필요 없다.
GET /api/products/featured?limit=4가 메인 페이지를 대체한다.
GET /api/categories/{id}와 GET /api/products?categoryId={id}가 카테고리 페이지를 대체한다.
GET /api/sitemap-data가 sitemap.ts를 대체한다.
src/app/api 제거 조건이 충족된다.
메인/제품/카테고리/sitemap이 Spring API 기반으로 동작한다.
운영 DB 스키마는 변경되지 않는다.
Flyway가 이후 DB schema 변경의 단일 소유자다.
```

## 이번 단계에서 하지 않을 일

```text
Prisma 파일 즉시 삭제
운영 DB DDL 실행
SEO URL 구조 변경
Spring API 응답 형태 임의 변경
```
