# Category 도메인 구현 명세

작성일: 2026-05-30

## 목표

회사별 제품 카테고리 조회, 등록, 삭제 기능을 Spring Boot로 이전한다.

이번 단계에서는 기존 API path를 유지하면서 `name + companyId` 중복 방지와 제품 연결 카테고리 삭제 방지 규칙을 명확히 구현한다.

## 범위

이번에 할 일:

```text
GET /api/categories?companyId=
POST /api/categories
DELETE /api/categories?id=
Category Entity/Repository 사용
ProductReader를 통한 제품 연결 수 확인
CategoryReader 제공
```

이번에 하지 않을 일:

```text
카테고리 수정 API
회사 Company Entity 추가
카테고리 순서 관리
카테고리 병합
```

## 현재 상태

기존 호출 위치:

```text
src/hooks/useProductAdmin.ts
src/app/products/page.tsx
```

DB:

```text
"Category"
- id integer PK
- name text not null
- companyId integer not null
- unique(name, companyId)
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/category/
├─ CategoryController.java
├─ CategoryService.java
├─ CategoryReader.java
├─ Category.java
├─ CategoryRepository.java
└─ dto/
   ├─ CategoryCreateRequest.java
   └─ CategoryResponse.java
```

## API 계약

### GET /api/categories?companyId=

인증:

```text
필요 없음
```

Request:

```http
GET /api/categories?companyId=1
```

검증:

```text
companyId 필수
Integer 변환 가능해야 함
companyId 없는 호출은 400 Bad Request 유지
```

Response:

```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "imi",
      "companyId": 1
    }
  ]
}
```

정렬:

```text
name asc
```

Success status:

```text
200 OK
```

Failure:

```text
400 Bad Request: companyId 누락 또는 변환 실패
```

### POST /api/categories

인증:

```text
관리자 필요
```

Request:

```json
{
  "name": "카테고리명",
  "companyId": 1
}
```

검증:

```text
name 필수
companyId 필수
name trim 후 빈 문자열 금지
name + companyId 중복 금지
```

성공:

```text
201 Created
```

```json
{
  "success": true,
  "message": "카테고리가 추가되었습니다.",
  "category": {
    "id": 1,
    "name": "카테고리명",
    "companyId": 1
  }
}
```

중복:

```text
409 Conflict
```

그 외 실패:

```text
400 Bad Request: name/companyId 누락
401 Unauthorized: 관리자 인증 필요
500 Internal Server Error: 서버 오류
```

```json
{
  "success": false,
  "message": "이미 존재하는 카테고리입니다."
}
```

### DELETE /api/categories?id=

기존 프론트 호환을 위해 query 방식 유지.

인증:

```text
관리자 필요
```

Request:

```http
DELETE /api/categories?id=1
```

정책:

```text
id 필수
Category 존재 확인
ProductReader.countByCategoryId(id) 확인
제품이 연결되어 있으면 삭제 금지
```

성공:

```text
200 OK
```

```json
{
  "success": true,
  "message": "카테고리가 삭제되었습니다."
}
```

제품 연결:

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "해당 카테고리에 속한 제품이 있어 삭제할 수 없습니다."
}
```

그 외 실패:

```text
400 Bad Request: id 누락 또는 변환 실패
401 Unauthorized: 관리자 인증 필요
404 Not Found: 카테고리를 찾을 수 없음
500 Internal Server Error: 서버 오류
```

## DTO 기준

```java
public record CategoryCreateRequest(
    String name,
    Integer companyId
) {}
```

```java
public record CategoryResponse(
    Integer id,
    String name,
    Integer companyId
) {}
```

## Service 기준

`CategoryService` 책임:

```text
companyId 검증
카테고리 목록 조회
name trim
중복 확인
카테고리 생성
삭제 전 ProductReader로 제품 연결 수 확인
CategoryResponse 변환
```

`CategoryReader` 책임:

```text
getCategoryForProduct(Integer categoryId)
existsById(Integer categoryId)
제품 도메인에서 필요한 최소 카테고리 조회 제공
```

금지:

```text
ProductRepository 직접 주입
Product Entity 목록 직접 순회
회사 정보를 enum으로 임의 고정
CategoryReader가 ProductReader 또는 ProductService를 참조
Reader 간 상호 참조
```

## Repository 기준

필요 메서드:

```java
List<Category> findByCompanyIdOrderByNameAsc(Integer companyId);
boolean existsByNameAndCompanyId(String name, Integer companyId);
Optional<Category> findById(Integer id);
```

## 예외 처리

```text
400: companyId/id 누락 또는 변환 실패
401: 관리자 인증 필요
404: 카테고리 없음
409: name + companyId 중복
500: 서버 오류
```

## 테스트 기준

Repository:

```text
companyId 기준 name asc 조회
existsByNameAndCompanyId 동작
unique 제약과 Entity 매핑 확인
```

Service:

```text
companyId 누락 400
name blank 400
중복 생성 409
제품 연결 카테고리 삭제 400
제품 미연결 카테고리 삭제 성공
```

Controller:

```text
GET /api/categories?companyId=1 응답 형태 유지
POST /api/categories 인증 없음 401
DELETE /api/categories?id= 인증 없음 401
```

완료 기준:

```text
기존 DELETE /api/categories?id= path가 유지된다.
제품 연결 카테고리는 삭제되지 않는다.
CategoryService가 ProductRepository를 직접 참조하지 않는다.
name + companyId 중복 생성이 방지된다.
```
