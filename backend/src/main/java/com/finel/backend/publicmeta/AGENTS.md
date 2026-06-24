# Public Meta 패키지 작업 지침

이 파일은 `com.finel.backend.publicmeta`와 하위 `dto` 패키지에 적용된다.

## 작업 전 확인할 문서

1. `docs/spring-migration-decisions.md`
2. `docs/migration-runbook.md`
3. `docs/api-contract.md`의 SEO/정적 데이터 API
4. `backend/docs/public-meta-spec.md`
5. `docs/e2e-verification-spec.md`의 sitemap 검증

## 패키지 책임

- `PublicMetaController`: 공개 `GET /api/sitemap-data` 계약만 제공한다.
- `PublicMetaService`: visible 제품과 카테고리의 최소 sitemap 데이터를 조립한다.
- DTO와 projection은 sitemap에 필요한 필드만 가진다.
- 제품·카테고리 생성, 수정, 삭제나 관리자 기능을 넣지 않는다.

## 고정 API 계약

- `GET /api/sitemap-data`는 인증과 query/body 없이 접근 가능한 공개 API다.
- 제품은 `isVisible=true`만 포함하고 `id`, `updatedAt`만 반환한다.
- 카테고리는 숨김 필드가 없으므로 전체 `id`를 반환한다.
- 두 목록은 안정적인 sitemap을 위해 id 오름차순이다.
- 빈 결과는 null이 아니라 `products=[]`, `categories=[]`다.
- updatedAt은 UTC `...Z` ISO-8601 문자열이다. `LocalDateTime`을 그대로 반환하지 않는다.
- 실패는 500과 `docs/api-contract.md`의 고정 JSON 메시지를 반환한다.

## 조회와 의존성 규칙

- 이 읽기 전용 집계 기능에서는 ProductRepository와 CategoryRepository의 전용 projection 조회를 사용할 수 있다.
- Entity 전체 로딩보다 `ProductSitemapProjection(id, updatedAt)`과 `CategorySitemapProjection(id)`을 우선한다.
- Product category join은 필요하지 않다.
- 숨김 제품이 포함될 수 있는 범용 `findAll()`을 사용하지 않는다.
- PublicMetaService가 제품·카테고리의 변경 Service를 호출하거나 변경 로직을 소유하지 않는다.
- 별도의 sitemap용 DB 테이블이나 컬럼을 추가하지 않는다.

## Next.js 전환 경계

- 최종 소비자는 `src/app/sitemap.ts`이며 Prisma import 없이 이 API만 사용해야 한다.
- Spring에서 `sitemap.xml` 자체를 렌더링하거나 robots.txt를 생성하지 않는다.
- 제품 상세 정보, SEO title/description, 숨김 제품 데이터를 응답에 추가하지 않는다.
- API 필드 변경 시 Next.js sitemap 소비 코드와 `docs/api-contract.md`를 함께 검토한다.

## 테스트와 검증

- product projection이 hidden 제품을 제외하고 id asc인지 검증한다.
- category projection이 전체 id를 asc로 반환하는지 검증한다.
- 제품이 없어도, 카테고리가 없어도 빈 배열 응답인지 검증한다.
- updatedAt의 UTC ISO 문자열 형식을 검증한다.
- 인증 없이 200이고 DB 실패 시 공통 500 JSON인지 검증한다.
- E2E에서는 `src/app/sitemap.ts`의 Prisma import 제거, 제품/카테고리 URL 생성, hidden URL 제외를 확인한다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`를 실행한다.

## 이번 구현 변경

- visible 제품의 id/updatedAt과 전체 카테고리 id만 반환하는 sitemap API를 구현했다.
- projection을 사용하고 결과는 id 오름차순, UTC 문자열 계약을 따른다.
- 검증: Spring 컴파일 및 tester의 숨김 제품 제외 테스트 대상이다.
- tester: projection 응답의 최소 필드와 UTC ISO 문자열 계약 테스트를 추가했다.
