# Public Meta 도메인 구현 명세

작성일: 2026-05-31

## 목표

Next.js가 Prisma 없이 sitemap과 공개 메타 데이터를 생성할 수 있도록 최소 공개 데이터를 제공한다.

이번 단계에서 해결하려는 문제는 `src/app/sitemap.ts`가 직접 Prisma로 제품/카테고리 URL을 조회하는 구조를 제거하는 것이다. 최종 상태에서 Next.js는 `GET /api/sitemap-data`만 호출해 sitemap을 만들 수 있어야 한다.

## 범위

이번에 할 일:

```text
GET /api/sitemap-data 구현
제품 sitemap item 조회
카테고리 sitemap item 조회
숨김 제품 제외
Response DTO 정의
```

이번에 하지 않을 일:

```text
Spring에서 sitemap.xml 직접 렌더링
robots.txt 생성
SEO title/description 전체 제공
제품 상세 데이터 전체 반환
관리자용 meta API
```

다음 단계로 넘길 일:

```text
Spring에서 sitemap을 직접 제공할지 여부
lastModified 정밀도/타임존 정책 고도화
카테고리 updatedAt 컬럼이 필요할지 검토
```

## 현재 상태

현재 직접 Prisma 사용처:

```text
src/app/sitemap.ts
```

현재 역할:

```text
공개 제품 URL 생성
카테고리 URL 생성
제품 updatedAt 기반 lastModified 생성
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/publicmeta/
├─ PublicMetaController.java
├─ PublicMetaService.java
└─ dto/
   ├─ SitemapDataResponse.java
   ├─ SitemapProductItem.java
   └─ SitemapCategoryItem.java
```

Repository 의존:

```text
PublicMetaService → ProductRepository 읽기 전용 메서드
PublicMetaService → CategoryRepository 읽기 전용 메서드
```

주의:

```text
PublicMetaService는 제품/카테고리 변경 로직을 갖지 않는다.
PublicMetaService는 sitemap에 필요한 최소 조회만 수행한다.
```

## API 계약

### GET /api/sitemap-data

Request:

```http
GET /api/sitemap-data
```

Query parameter:

```text
없음
```

Request body:

```text
없음
```

인증:

```text
필요 없음
```

조회 정책:

```text
제품은 isVisible=true만 포함한다.
제품은 id, updatedAt만 반환한다.
카테고리는 id만 반환한다.
카테고리는 현재 DB에 숨김 플래그가 없으므로 전체 포함한다.
정렬은 sitemap 안정성을 위해 id asc를 기본으로 한다.
```

Success status:

```text
200 OK
```

Success response:

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
      "id": 10
    }
  ]
}
```

Failure:

```text
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "사이트맵 데이터를 조회하는 중 오류가 발생했습니다."
}
```

## DTO 기준

```java
public record SitemapDataResponse(
    boolean success,
    List<SitemapProductItem> products,
    List<SitemapCategoryItem> categories
) {}
```

```java
public record SitemapProductItem(
    Integer id,
    String updatedAt
) {}
```

```java
public record SitemapCategoryItem(
    Integer id
) {}
```

날짜 직렬화:

```text
updatedAt은 Response DTO에서 ISO-8601 문자열로 변환한다.
목표 형식은 2026-05-27T10:00:00.000Z 이다.
Entity의 LocalDateTime을 그대로 JSON으로 반환하지 않는다.
```

## Service 기준

`PublicMetaService` 책임:

```text
visible 제품 sitemap item 조회
카테고리 sitemap item 조회
SitemapDataResponse 조립
날짜 문자열 변환
```

금지:

```text
제품/카테고리 생성, 수정, 삭제
관리자 인증 요구
제품 상세 정보 전체 반환
숨김 제품 반환
```

## Repository 조회 방식

ProductRepository 추가 메서드:

```java
@Query("""
    select p.id as id, p.updatedAt as updatedAt
    from Product p
    where p.isVisible = true
    order by p.id asc
""")
List<ProductSitemapProjection> findVisibleSitemapItems();
```

CategoryRepository 추가 메서드:

```java
@Query("""
    select c.id as id
    from Category c
    order by c.id asc
""")
List<CategorySitemapProjection> findAllSitemapItems();
```

Projection 기준:

```java
public interface ProductSitemapProjection {
    Integer getId();
    LocalDateTime getUpdatedAt();
}
```

```java
public interface CategorySitemapProjection {
    Integer getId();
}
```

주의:

```text
Entity 전체를 로딩하지 않아도 되는 API이므로 projection을 우선한다.
Product.category join은 필요 없다.
```

## 테스트 기준

Repository:

```text
findVisibleSitemapItems는 isVisible=false 제품 제외
findVisibleSitemapItems는 id와 updatedAt만 조회
findAllSitemapItems는 카테고리 id 목록 조회
정렬은 id asc
```

Service:

```text
products와 categories를 모두 포함한 응답 생성
제품 updatedAt을 ISO 문자열로 변환
제품이 없으면 products=[]
카테고리가 없으면 categories=[]
숨김 제품 제외
```

Controller:

```text
GET /api/sitemap-data 인증 없이 200
응답 형태가 docs/api-contract.md와 일치
DB 조회 실패 시 500 + 공통 실패 응답
```

E2E:

```text
src/app/sitemap.ts가 Prisma를 import하지 않음
src/app/sitemap.ts가 GET /api/sitemap-data를 사용
sitemap에 숨김 제품 URL이 없음
제품 URL과 카테고리 URL이 생성됨
```

## 완료 기준

```text
GET /api/sitemap-data가 정식 공개 API로 구현되어 있다.
Next.js sitemap.ts가 Prisma 없이 동작한다.
숨김 제품이 sitemap에 포함되지 않는다.
응답 JSON이 api-contract.md와 일치한다.
운영 DB 스키마가 변경되지 않는다.
```

## 이번 단계에서 하지 않을 일

```text
sitemap.xml 자체를 Spring에서 생성
카테고리 updatedAt 컬럼 추가
제품/카테고리 SEO 전체 필드 추가
관리자 전용 meta API 추가
```
