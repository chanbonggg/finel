# Category 패키지 작업 지침

이 파일은 `com.finel.backend.category`와 하위 `dto` 패키지에 적용된다.

## 작업 전 확인할 문서

1. `docs/spring-migration-decisions.md`
2. `docs/migration-runbook.md`
3. `docs/api-contract.md`의 카테고리 API
4. `backend/docs/category-spec.md`
5. `docs/spring-boot-step3-db-model-implementation-spec.md`의 Category 매핑

## 패키지 책임

- `CategoryController`: 목록, 상세, 생성, 삭제의 HTTP 계약을 담당한다.
- `CategoryService`: 입력 정규화, 중복 확인, 조회, 생성, 삭제 정책과 DTO 변환을 담당한다.
- `CategoryRepository`: Category 전용 영속성 조회만 담당한다.
- `CategoryReader`: product 도메인이 카테고리를 확인할 때 필요한 최소 읽기 인터페이스를 제공한다.
- DTO는 `category/dto`에 두고 Entity를 API로 직접 반환하지 않는다.

## 고정 API 계약

- `GET /api/categories?companyId=`는 공개 API다. `companyId`는 필수이며 name 오름차순으로 반환한다.
- 파라미터 없는 전체 카테고리 조회로 확장하지 않는다. 필요하면 별도 명세를 먼저 작성한다.
- `GET /api/categories/{id}`는 공개 상세 API이며 없음은 404다.
- `POST /api/categories`는 관리자 인증과 CSRF가 필요하고 성공은 201이다.
- 생성 시 name을 trim하고 blank를 거부한다. `name + companyId` 중복은 409다.
- `DELETE /api/categories?id=` query 형식을 기존 프런트 호환을 위해 유지한다.
- 연결된 제품이 하나라도 있으면 삭제하지 않고 400과 고정 메시지를 반환한다.
- 성공 응답의 category는 `id`, `name`, `companyId`를 포함한다.

## 의존성 규칙

- category가 product 기능을 확인할 때 `ProductReader`만 사용한다.
- `CategoryService` 또는 `CategoryReader`에서 `ProductRepository`를 직접 주입하지 않는다.
- `CategoryReader`는 `ProductReader`, 다른 Reader, 다른 도메인 Service를 참조하지 않는다.
- product는 `CategoryReader`를 사용할 수 있지만 Reader 간 상호 참조를 만들지 않는다.
- 회사 정보를 enum이나 하드코딩된 목록으로 임의 고정하지 않는다.

## JPA와 구현 패턴

- 기존 PostgreSQL의 quoted `"Category"`, `"companyId"` 매핑과 `Category_name_companyId_key` unique 제약을 유지한다.
- protected 기본 생성자와 `Category.create(name, companyId)` 패턴을 재사용한다.
- `Category.products`를 API로 직렬화하거나 삭제 검사를 위해 전체 로딩하지 않는다.
- 제품 연결 여부는 count query로 확인한다.
- `ddl-auto`로 스키마를 변경하지 않는다. 명시적 마이그레이션 작업이 아니면 Entity 변경과 DDL을 추가하지 않는다.
- DB unique violation도 경쟁 상태에서 409로 일관되게 변환되도록 애플리케이션 사전 검사만 믿지 않는다.

## 테스트와 검증

- companyId별 name asc 조회와 `name + companyId` unique 동작을 검증한다.
- blank name, 누락/잘못된 companyId와 id, 중복 생성, 없는 상세를 검증한다.
- 제품 연결 삭제 거부와 미연결 삭제 성공을 검증한다.
- 생성·삭제 API의 인증 없음 401과 CSRF 없음 403을 검증한다.
- 테스트 데이터는 테스트가 생성한 fixture만 삭제한다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`를 실행한다.

## 이번 구현 변경

- 회사별 목록, 상세, 관리자 생성·삭제를 구현했다.
- 중복은 409, 제품 연결 카테고리 삭제는 400으로 처리한다.
- `ProductReader`로 연결 수를 조회하고 `CategoryReader`를 제품 도메인에 제공한다.
- 검증: Spring 컴파일 및 tester의 중복/삭제 경계 테스트 대상이다.
