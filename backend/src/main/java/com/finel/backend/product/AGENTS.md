# Product 패키지 작업 지침

이 파일은 `com.finel.backend.product`와 하위 `dto` 패키지에 적용된다.

## 작업 전 확인할 문서

1. `docs/spring-migration-decisions.md`
2. `docs/migration-runbook.md`
3. `docs/api-contract.md`의 제품 API
4. `backend/docs/product-spec.md`
5. `docs/spring-boot-step3-db-model-implementation-spec.md`의 Product 매핑
6. `docs/e2e-verification-spec.md`의 공개/관리자 제품 플로우

## 패키지 책임

- `ProductController`: 제품 목록, category/featured 필터, 상세, 검색, 생성, 수정, 삭제의 HTTP 계약을 담당한다.
- `ProductService`: 공개/관리자 조회 분기, 검증, Category 조회, 쓰기 작업, DTO 변환을 담당한다.
- `ProductRepository`: Product 전용 쿼리와 필요한 fetch 전략을 담당한다.
- `ProductReader`: 다른 도메인에 `countByCategoryId` 같은 최소 읽기 기능만 제공한다.
- DTO는 `product/dto`에 두고 Entity와 분리한다.

## 공개 조회 계약

- 기본 `GET /api/products`는 인증 없이 `isVisible=true`만 `createdAt desc`로 반환한다.
- `includeHidden=true`는 관리자만 사용할 수 있으며 전체 제품을 같은 응답 형태로 반환한다.
- `categoryId` 조회는 공개 visible 제품만 반환한다. 없는 Category는 404, 제품 없음은 200과 빈 배열이다.
- `categoryId`와 `includeHidden=true` 동시 사용은 400이다.
- `/api/products/featured`는 visible만 최신순으로 반환하며 limit 기본 4, 최대 12다.
- `/api/products/{id}`는 선택적 인증을 하지 않는다. 숨김 제품은 cookie 유무와 관계없이 공개 API에서 404다.
- `/api/products/search`는 trim한 q로 visible name 부분 일치 검색을 수행한다. 빈 q는 빈 배열, 최대 10개다.

## 관리자 쓰기 계약

- POST/PATCH/DELETE는 관리자 인증과 CSRF가 필요하다.
- 생성 요청의 categoryId는 문자열과 숫자 입력을 계약대로 정규화하고, name/categoryId/spec을 필수 검증한다.
- 생성 기본값은 `description=""`, `imageUrl=""`, `isVisible=true`다.
- 수정은 제품과 Category 존재를 확인하고 `isVisible=false`도 정상 반영한다.
- 삭제 대상 없음은 404이며 현재 계약은 hard delete다. 임의로 soft delete로 바꾸지 않는다.
- 응답의 `category`는 객체가 아니라 이름 문자열이고 `companyId`는 최상위 필드다.
- `createdAt`, `updatedAt`은 UTC `...Z` ISO-8601 문자열로 변환한다. Entity의 `LocalDateTime`을 그대로 반환하지 않는다.

## 의존성과 조회 규칙

- product는 category의 `CategoryReader`만 사용한다. `CategoryRepository`를 직접 주입하지 않는다.
- `ProductReader`는 자기 도메인의 `ProductRepository`만 참조한다.
- Reader가 다른 Reader나 다른 도메인 Service를 참조하지 않게 해 순환 의존을 방지한다.
- `Product.category`는 LAZY를 유지한다.
- 목록, 상세, 검색에서 category가 필요하면 기존 `@EntityGraph` 또는 fetch join 패턴을 사용해 N+1과 `LazyInitializationException`을 방지한다.
- Cloudinary 업로드는 이 패키지 범위가 아니다.

## JPA와 구현 패턴

- 기존 quoted `"Product"`, `"categoryId"`, `"isVisible"`, `"createdAt"`, `"updatedAt"` 매핑을 유지한다.
- protected 기본 생성자, `Product.create(...)`, 도메인 `update(...)`, `@PrePersist`, `@PreUpdate` 패턴을 재사용한다.
- setter를 공개하거나 Controller에서 Entity 필드를 조립하지 않는다.
- `open-in-view=false`를 전제로 서비스 트랜잭션과 fetch 범위를 설계한다.
- `ddl-auto`를 update/create로 바꾸지 않고 Prisma migration/db push를 실행하지 않는다.

## 테스트와 검증

- 공개 목록·상세·검색·category·featured에서 숨김 제품 제외를 검증한다.
- 관리자 전체 목록의 인증 경계와 전체 제품 반환을 검증한다.
- category fetch, 정렬, 검색 최대 10개, featured limit 경계를 검증한다.
- 생성 기본값, categoryId 변환, 없는 Category/Product, 수정 시간과 visibility를 검증한다.
- POST/PATCH/DELETE의 401과 403을 각각 검증한다.
- 응답 JSON의 category 문자열, companyId, UTC 날짜 형식을 검증한다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`를 실행한다.

## 이번 구현 변경

- 공개 목록/상세/검색/featured/categoryId 조회와 관리자 생성·수정·삭제를 구현했다.
- 숨김 제품 공개 제외, `includeHidden=true` 인증 확인, 평탄화된 응답과 UTC 날짜 변환을 적용했다.
- `CategoryReader`만 사용해 다른 도메인 Repository 직접 의존을 피했다.
- sitemap projection과 `ProductReader.countByCategoryId`를 추가했다.
- 검증: Spring 컴파일 및 tester의 Controller/Service/Repository 테스트 대상이다.
- tester: 공개 visible 목록의 평탄화 응답, 숨김 상세 404, 관리자 전체 목록 인증, 금지된 필터 조합 테스트를 추가했다.
