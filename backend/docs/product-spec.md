# Product 도메인 구현 명세

작성일: 2026-05-30

## 목표

제품 목록, 상세, 검색, 등록, 수정, 삭제 기능을 Spring Boot로 이전한다.

이번 단계에서 해결할 문제는 기존 Next.js API가 반환하던 제품 응답 형태를 유지하면서, 공개 제품 목록과 관리자 전체 목록의 노출 정책을 분리하는 것이다.

최종 사용자는 공개 페이지에서 노출 가능한 제품만 보고, 관리자는 숨김 제품을 포함한 전체 제품을 관리할 수 있어야 한다.

## 범위

이번에 할 일:

```text
GET /api/products
GET /api/products?includeHidden=true
GET /api/products?categoryId=
GET /api/products/featured?limit=
GET /api/products/{id}
GET /api/products/search?q=
POST /api/products
PATCH /api/products/{id}
DELETE /api/products/{id}
Product Entity/Repository 사용
CategoryReader를 통한 카테고리 조회
ProductReader 제공
```

이번에 하지 않을 일:

```text
Cloudinary 업로드 API 이전
제품 이미지 signed upload 발급
제품 카테고리 대량 이동
검색 엔진 도입
페이지네이션 구조 변경
```

다음 단계로 넘길 일:

```text
제품 목록 페이지네이션
관리자 필터/정렬 고도화
이미지 업로드 보안 강화
```

## 현재 상태

기존 호출 위치:

```text
src/hooks/useProductAdmin.ts
src/app/products/page.tsx
src/app/products/[id]/page.tsx
src/app/contact/page.tsx
```

기존 DB:

```text
"Product"
- id integer PK
- name text not null
- categoryId integer FK not null
- spec text not null
- description text not null
- imageUrl text not null
- isVisible boolean not null default true
- createdAt timestamp not null
- updatedAt timestamp not null
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/product/
├─ ProductController.java
├─ ProductService.java
├─ ProductReader.java
├─ Product.java
├─ ProductRepository.java
└─ dto/
   ├─ ProductCreateRequest.java
   ├─ ProductUpdateRequest.java
   ├─ ProductResponse.java
   └─ ProductSearchResponse.java
```

도메인 의존:

```text
product → category.CategoryReader 허용
category → product.ProductReader 허용
product → category.CategoryRepository 직접 주입 금지
category → product.ProductRepository 직접 주입 금지
Reader는 같은 도메인의 Repository만 참조한다.
Reader가 다른 Reader 또는 다른 도메인 Service를 참조하지 않는다.
Reader 간 상호 참조를 금지해 순환 의존을 막는다.
```

## API 계약

### GET /api/products

공개 제품 목록이다.

Request:

```http
GET /api/products
```

인증:

```text
필요 없음
```

조회 정책:

```text
isVisible=true 제품만 조회
createdAt desc
category EntityGraph 포함
```

Success status:

```text
200 OK
```

Response:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "제품명",
      "categoryId": 10,
      "category": "카테고리명",
      "companyId": 1,
      "spec": "220V / 60Hz",
      "description": "제품 설명",
      "imageUrl": "https://...",
      "isVisible": true,
      "createdAt": "2026-05-27T10:00:00.000Z",
      "updatedAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

### GET /api/products?includeHidden=true

관리자 전체 제품 목록이다.

인증:

```text
관리자 필요
```

조회 정책:

```text
isVisible=true/false 모두 조회
createdAt desc
응답 형태는 공개 목록과 동일
```

Success status:

```text
200 OK
```

주의:

```text
includeHidden=true인데 인증이 없으면 401
includeHidden 값이 없거나 false이면 공개 목록으로 처리
```

### GET /api/products?categoryId=

카테고리별 공개 제품 목록이다. Prisma 직접 사용 제거를 위한 정식 API다.

인증:

```text
필요 없음
```

정책:

```text
categoryId 필수
categoryId에 해당하는 Category가 존재해야 함
isVisible=true만 조회
createdAt desc
category 포함 조회
```

Success status:

```text
200 OK
```

실패:

```text
400 Bad Request: categoryId 누락 또는 변환 실패
400 Bad Request: includeHidden=true와 categoryId 동시 사용
404 Not Found: 카테고리를 찾을 수 없음
```

응답:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "제품명",
      "categoryId": 10,
      "category": "카테고리명",
      "companyId": 1,
      "spec": "220V / 60Hz",
      "description": "제품 설명",
      "imageUrl": "https://...",
      "isVisible": true,
      "createdAt": "2026-05-27T10:00:00.000Z",
      "updatedAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

주의:

```text
카테고리는 존재하지만 제품이 없으면 200 OK와 products=[]를 반환한다.
includeHidden=true와 categoryId를 같이 보내는 관리자 필터는 이번 계약에서 금지한다.
```

### GET /api/products/featured?limit=

메인 페이지 최신 공개 제품 목록이다. Prisma 직접 사용 제거를 위한 정식 API다.

인증:

```text
필요 없음
```

정책:

```text
isVisible=true만 조회
createdAt desc
limit 기본값 4
limit 최대값 12
category 포함 조회
```

Success status:

```text
200 OK
```

실패:

```text
400 Bad Request: limit 변환 실패
```

응답:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "제품명",
      "categoryId": 10,
      "category": "카테고리명",
      "companyId": 1,
      "spec": "220V / 60Hz",
      "description": "제품 설명",
      "imageUrl": "https://...",
      "isVisible": true,
      "createdAt": "2026-05-27T10:00:00.000Z",
      "updatedAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

### GET /api/products/{id}

제품 상세 조회다.

인증:

```text
필요 없음
```

정책:

```text
공개 호출은 isVisible=true 제품만 조회한다.
isVisible=false 제품은 공개 상세 API에서 조회하지 않는다.
숨김 제품 상세가 관리자 화면에서 필요하면 별도 관리자 상세 API를 새로 명세한다.
이 API는 선택적 인증을 하지 않는다.
유효하지 않은 auth_token 쿠키가 있어도 공개 visible 조회만 수행하며, 숨김 제품은 404로 처리한다.
category 포함 조회가 필요하다.
```

성공 응답:

```text
200 OK
```

```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "제품명",
    "categoryId": 10,
    "category": "카테고리명",
    "companyId": 1,
    "spec": "220V / 60Hz",
    "description": "제품 설명",
    "imageUrl": "https://...",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

실패:

```text
404 Not Found: 제품을 찾을 수 없습니다.
```

### GET /api/products/search?q=

공개 검색 API다.

인증:

```text
필요 없음
```

정책:

```text
q trim
빈 q이면 빈 배열 반환
isVisible=true만 검색
name 부분 일치
대소문자 무시
최대 10개
createdAt desc
```

Response:

```text
200 OK
```

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "제품명",
      "imageUrl": "https://...",
      "category": "카테고리명"
    }
  ]
}
```

### POST /api/products

제품 등록 API다.

인증:

```text
관리자 필요
```

Request:

```json
{
  "name": "제품명",
  "categoryId": "10",
  "spec": "220V / 60Hz",
  "description": "제품 설명",
  "imageUrl": "https://..."
}
```

검증:

```text
name 필수
categoryId 필수
spec 필수
categoryId는 문자열/숫자 모두 허용 후 Integer 변환
description, imageUrl은 없으면 빈 문자열
생성 시 isVisible=true
```

성공:

```text
201 Created
```

```json
{
  "success": true,
  "message": "제품이 성공적으로 등록되었습니다.",
  "product": {
    "id": 1,
    "name": "제품명",
    "categoryId": 10,
    "category": "카테고리명",
    "companyId": 1,
    "spec": "220V / 60Hz",
    "description": "제품 설명",
    "imageUrl": "https://...",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

### PATCH /api/products/{id}

제품 수정 API다.

인증:

```text
관리자 필요
```

Request:

```json
{
  "name": "제품명",
  "categoryId": "10",
  "spec": "220V / 60Hz",
  "description": "제품 설명",
  "imageUrl": "https://...",
  "isVisible": true
}
```

정책:

```text
id 존재 확인
categoryId가 있으면 CategoryReader로 존재 확인
isVisible은 true/false 모두 허용
updatedAt은 @PreUpdate로 갱신
```

성공:

```text
200 OK
```

```json
{
  "success": true,
  "message": "제품 정보가 수정되었습니다.",
  "product": {
    "id": 1,
    "name": "제품명",
    "categoryId": 10,
    "category": "카테고리명",
    "companyId": 1,
    "spec": "220V / 60Hz",
    "description": "제품 설명",
    "imageUrl": "https://...",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

실패:

```text
400 Bad Request: 필수값 누락 또는 categoryId 변환 실패
401 Unauthorized: 관리자 인증 필요
404 Not Found: 제품 또는 카테고리를 찾을 수 없음
```

### DELETE /api/products/{id}

제품 삭제 API다.

인증:

```text
관리자 필요
```

정책:

```text
존재하지 않는 id면 404
존재하면 삭제
운영 DB에서 실제 삭제가 부담되면 이후 soft delete로 별도 명세 작성
```

성공:

```text
200 OK
```

```json
{
  "success": true,
  "message": "제품이 삭제되었습니다."
}
```

실패:

```text
401 Unauthorized: 관리자 인증 필요
404 Not Found: 제품을 찾을 수 없음
```

## DTO 기준

```java
public record ProductCreateRequest(
    String name,
    String categoryId,
    String spec,
    String description,
    String imageUrl
) {}
```

```java
public record ProductUpdateRequest(
    String name,
    String categoryId,
    String spec,
    String description,
    String imageUrl,
    Boolean isVisible
) {}
```

```java
public record ProductResponse(
    Integer id,
    String name,
    Integer categoryId,
    String category,
    Integer companyId,
    String spec,
    String description,
    String imageUrl,
    Boolean isVisible,
    String createdAt,
    String updatedAt
) {}
```

날짜 직렬화:

```text
createdAt, updatedAt은 Response DTO에서 ISO-8601 문자열로 변환한다.
목표 형식은 2026-05-27T10:00:00.000Z 이다.
Entity의 LocalDateTime을 그대로 JSON으로 반환하지 않는다.
```

## Service 기준

`ProductService` 책임:

```text
공개/관리자 목록 분기
카테고리별 공개 제품 목록 조회
featured 공개 제품 목록 조회
제품 상세 조회
검색 q 정규화
요청 검증
categoryId 변환
categoryId와 includeHidden 조합 검증
CategoryReader로 카테고리 존재 확인
Product 생성/수정/삭제
ProductResponse 변환
```

`ProductReader` 책임:

```text
countByCategoryId(Integer categoryId)
다른 도메인이 필요한 최소 제품 조회 제공
```

`ProductService` 금지:

```text
CategoryRepository 직접 주입
HTTP 쿠키/세션 직접 처리
Cloudinary 업로드 처리
```

## Repository 기준

필요 메서드:

```java
List<Product> findAllByOrderByCreatedAtDesc();
List<Product> findByIsVisibleTrueOrderByCreatedAtDesc();
List<Product> findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc(Integer categoryId);
List<Product> findFeaturedVisibleProducts(Pageable pageable);
Optional<Product> findWithCategoryById(Integer id);
List<Product> searchVisibleProducts(String query, Pageable pageable);
long countByCategoryId(Integer categoryId);
```

`Product.category`는 LAZY로 두고, 목록/상세/검색은 `@EntityGraph(attributePaths = "category")` 또는 fetch join으로 category를 함께 로딩한다.

## 예외 처리

```text
400: 필수값 누락, categoryId 변환 실패
401: 관리자 인증 필요
404: 제품 없음 또는 카테고리 없음
500: 알 수 없는 서버 오류
```

기본 실패 응답:

```json
{
  "success": false,
  "message": "오류 메시지"
}
```

## 테스트 기준

Repository:

```text
findByIsVisibleTrueOrderByCreatedAtDesc는 숨김 제품 제외
findAllByOrderByCreatedAtDesc는 전체 제품 반환
searchVisibleProducts는 숨김 제품 제외, 최대 10개
findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc는 해당 카테고리의 visible 제품만 반환
findFeaturedVisibleProducts는 visible 제품을 createdAt desc로 limit만큼 반환
findWithCategoryById는 category 로딩
countByCategoryId 동작
```

Service:

```text
공개 목록은 visible만 반환
includeHidden=true는 관리자일 때만 전체 반환
categoryId 목록은 없는 카테고리면 404
categoryId 목록은 카테고리가 있고 제품이 없으면 빈 배열
categoryId와 includeHidden=true 동시 사용은 400
featured limit 기본값 4, 최대값 12
categoryId 문자열 변환
카테고리 없음 404
제품 생성 시 isVisible=true
수정 시 updatedAt 갱신
```

Controller:

```text
GET /api/products 공개 응답 형태 유지
GET /api/products?includeHidden=true 인증 없음 401
GET /api/products?categoryId= 없는 카테고리 404
GET /api/products?categoryId= 제품 없음 200 + products=[]
GET /api/products?categoryId=&includeHidden=true 400
GET /api/products/featured?limit=4 200 + 최대 4개
POST/PATCH/DELETE 인증 없음 401
검색 빈 q는 success=true, products=[]
```

완료 기준:

```text
공개 제품 목록에 isVisible=false가 노출되지 않는다.
관리자 전체 목록은 기존 응답 형태를 유지한다.
ProductResponse의 category는 객체가 아니라 문자열이다.
ProductResponse의 companyId가 최상위에 포함된다.
CategoryRepository 직접 참조 없이 구현된다.
숨김 제품 상세가 공개 호출로 노출되지 않는다.
GET /api/products/{id}는 선택적 인증을 하지 않는다.
```
