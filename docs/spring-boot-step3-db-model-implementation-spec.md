# 3단계 DB 모델 이전 구현 명세

작성일: 2026-05-30

## 목표

3단계의 목표는 기존 Prisma 모델을 기준으로 Spring Boot 백엔드의 JPA Entity와 Repository를 구현하는 것이다.

이 단계에서는 API Controller를 완성하지 않는다. 화면에서 호출 가능한 REST API 구현도 아직 하지 않는다. 대신 Spring Boot가 기존 PostgreSQL 스키마를 안전하게 읽고, 도메인별 Repository를 통해 필요한 조회/저장/삭제 작업을 수행할 수 있는 상태까지 만든다.

## 기준 문서

3단계 구현은 다음 문서를 기준으로 한다.

```text
docs/spring-refactor-rough-plan.md
docs/spring-boot-step2-skeleton-spec.md
docs/api-contract.md
prisma/schema.prisma
```

중요한 우선순위는 다음과 같다.

```text
1. 기존 DB 스키마 변경 금지
2. Prisma 모델과 JPA Entity 매핑 일치
3. 기존 API 응답에 필요한 데이터 조회 가능
4. 운영 DB가 아닌 로컬/개발 DB에서 먼저 검증
5. 도메인 단위 구조 유지
6. 테스트가 기존 seed 데이터와 개발 DB를 오염시키지 않음
```

## 3단계 범위

### 포함

```text
JPA Entity 구현
Entity 관계 매핑
Repository 구현
기본 조회 메서드 작성
DB 연결 설정 검증
JPA naming/quote 전략 정리
Entity/Repository 단위 테스트
도메인별 명세서 갱신
```

### 제외

```text
REST API Controller 구현
인증/인가 구현
JWT 발급 구현
메일 발송 구현
Next.js fetch 경로 변경
Next.js API Route 제거
운영 DB 마이그레이션
DB 컬럼 추가/삭제/변경
```

## 현재 Prisma 모델

현재 DB 모델은 네 개다.

```text
Admin
Category
Product
Inquiry
```

원본 스키마:

```prisma
model Admin {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String
  companyId Int
  products  Product[]

  @@unique([name, companyId])
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  categoryId  Int
  category    Category @relation(fields: [categoryId], references: [id])
  spec        String
  description String   @db.Text
  imageUrl    String
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Inquiry {
  id        Int      @id @default(autoincrement())
  name      String
  phone     String?
  email     String
  content   String   @db.Text
  company   String?
  product   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## PostgreSQL 테이블/컬럼 주의사항

Prisma는 PostgreSQL에서 대문자가 포함된 모델명과 camelCase 컬럼명을 quoted identifier로 생성한다.

따라서 JPA에서 테이블명과 컬럼명을 정확히 맞춰야 한다.

예상 테이블명:

```text
"Admin"
"Category"
"Product"
"Inquiry"
```

예상 주요 컬럼명:

```text
"createdAt"
"companyId"
"categoryId"
"imageUrl"
"isVisible"
"updatedAt"
"isRead"
```

Hibernate가 기본 naming strategy로 `createdAt`을 `created_at`처럼 바꾸면 기존 Prisma 테이블과 맞지 않는다. 3단계에서는 명시적 `@Table`, `@Column`, `@JoinColumn`을 사용해서 모든 테이블/컬럼 이름을 정확히 적는다.

권장 방식:

```java
@Table(name = "\"Product\"")
@Column(name = "\"createdAt\"")
@JoinColumn(name = "\"categoryId\"")
```

## 실제 DB 구조 확인 절차

Entity를 구현하기 전에 Prisma schema만 믿지 말고 실제 PostgreSQL 테이블 정의를 확인한다. Neon 또는 로컬 PostgreSQL에 연결한 뒤 다음 쿼리 결과를 명세와 대조한다.

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_name in ('Admin', 'Category', 'Product', 'Inquiry')
order by table_name, ordinal_position;
```

추가로 FK와 unique 제약을 확인한다.

```sql
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.table_name in ('Admin', 'Category', 'Product', 'Inquiry')
order by tc.table_name, tc.constraint_type, tc.constraint_name;
```

확인할 항목:

```text
테이블명이 "Admin", "Category", "Product", "Inquiry"인지
camelCase 컬럼이 quoted identifier로 존재하는지
id 컬럼 타입이 integer 계열인지
TEXT 컬럼이 content/description에만 적용되어 있는지
nullable 여부가 Prisma 모델과 일치하는지
email 컬럼이 Inquiry에서 not null인지
Product.categoryId FK와 Category(name, companyId) unique 제약이 존재하는지
```

실제 DB 정의가 이 문서와 다르면 코드를 추측으로 맞추지 말고, 이 문서와 도메인 명세서를 먼저 갱신한 뒤 Entity 매핑을 작성한다.

## JPA 설정 원칙

기존 DB 스키마를 보호하기 위해 Hibernate 자동 DDL 변경은 금지한다.

`application-local.yml`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: true
```

처음 Entity 매핑을 맞추는 중에 validate가 계속 실패하면 일시적으로 `none`을 사용할 수 있다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

금지:

```text
ddl-auto: update
ddl-auto: create
ddl-auto: create-drop
```

이 값들은 기존 PostgreSQL 스키마를 바꿀 수 있으므로 사용하지 않는다.

## 타입 매핑 기준

| Prisma 타입 | Java 타입 | 비고 |
| --- | --- | --- |
| Int | Integer | 기존 API id가 숫자이며 Prisma Int와 일치 |
| String | String | 길이 제한 없는 기본 문자열 |
| String @db.Text | String | `columnDefinition = "TEXT"` 사용 |
| Boolean | Boolean | 기본값은 DB와 Java 양쪽에서 방어 |
| DateTime | LocalDateTime | 기존 API의 날짜 직렬화 형태 확인 필요 |

ID는 `Integer`를 우선 사용한다. Prisma 모델이 `Int`이고 PostgreSQL integer 기반이므로 `Long`으로 넓히는 변경은 3단계에서 하지 않는다.

날짜는 `LocalDateTime`을 우선 사용한다. API 응답 직렬화에서 기존 Next.js 응답과 차이가 생기면 4단계 API 구현 시 포맷을 맞춘다.

## 도메인별 구현 위치

2단계 명세의 도메인 단위 구조를 유지한다.

```text
backend/src/main/java/com/finel/backend/
├─ auth/
│  ├─ Admin.java
│  └─ AdminRepository.java
├─ category/
│  ├─ Category.java
│  └─ CategoryRepository.java
├─ product/
│  ├─ Product.java
│  └─ ProductRepository.java
└─ inquiry/
   ├─ Inquiry.java
   └─ InquiryRepository.java
```

도메인별 세부 DB 규칙은 `backend/docs/`의 도메인 명세서에도 반영한다.

```text
backend/docs/auth-spec.md
backend/docs/product-spec.md
backend/docs/category-spec.md
backend/docs/inquiry-spec.md
```

## Entity 공통 작성 기준

Entity에는 Lombok을 사용할 수 있다.

권장:

```java
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
```

주의:

```text
@Data 사용 금지
양방향 연관관계에서 toString 자동 생성 금지
Entity를 Controller 응답으로 직접 반환 금지
setter 전체 공개 지양
```

이유:

```text
@Data는 equals/hashCode/toString을 자동 생성해 연관관계 순환 참조 문제를 만들 수 있다.
Entity 직접 반환은 category-products 같은 양방향 관계에서 JSON 순환 참조 위험이 있다.
API 응답은 4단계에서 DTO로 변환한다.
```

## Admin Entity 명세

위치:

```text
backend/src/main/java/com/finel/backend/auth/Admin.java
```

역할:

```text
관리자 계정 저장
로그인 시 username으로 조회
bcrypt hash password 보관
```

필드:

| 필드 | Java 타입 | DB 컬럼 | 제약 |
| --- | --- | --- | --- |
| id | Integer | id | PK, auto increment |
| username | String | username | unique, not null |
| password | String | password | not null |
| createdAt | LocalDateTime | createdAt | not null |

구현 초안:

```java
package com.finel.backend.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "\"Admin\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;
}
```

생성/수정 메서드는 3단계에서 필수는 아니다. 관리자 계정은 기존 `prisma/seed.js`로 이미 생성되는 흐름이 있으므로 3단계에서는 조회 가능 여부를 먼저 확인한다.

## Admin Repository 명세

위치:

```text
backend/src/main/java/com/finel/backend/auth/AdminRepository.java
```

필요 메서드:

```java
Optional<Admin> findByUsername(String username);
boolean existsByUsername(String username);
```

구현 초안:

```java
package com.finel.backend.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Integer> {
    Optional<Admin> findByUsername(String username);
    boolean existsByUsername(String username);
}
```

사용 예정:

```text
4~5단계 AuthService에서 로그인 검증에 사용
```

## Category Entity 명세

위치:

```text
backend/src/main/java/com/finel/backend/category/Category.java
```

역할:

```text
회사별 제품 카테고리 저장
Product와 1:N 관계
name + companyId 복합 유니크 유지
```

필드:

| 필드 | Java 타입 | DB 컬럼 | 제약 |
| --- | --- | --- | --- |
| id | Integer | id | PK, auto increment |
| name | String | name | not null |
| companyId | Integer | companyId | not null |
| products | List<Product> | Product.categoryId | mappedBy |

구현 초안:

```java
package com.finel.backend.category;

import com.finel.backend.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
    name = "\"Category\"",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "Category_name_companyId_key",
            columnNames = {"name", "\"companyId\""}
        )
    }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "\"companyId\"", nullable = false)
    private Integer companyId;

    @OneToMany(mappedBy = "category")
    private List<Product> products = new ArrayList<>();
}
```

주의:

```text
Category.products는 API 응답으로 직접 내보내지 않는다.
3단계 Repository 테스트에서는 ProductRepository.countByCategoryId(id)를 직접 검증할 수 있다.
4단계 이후 Service 구현에서는 Category 도메인이 ProductRepository를 직접 주입하지 않고 ProductReader 같은 조회 컴포넌트를 통해 제품 연결 여부를 확인한다.
```

## Category Repository 명세

위치:

```text
backend/src/main/java/com/finel/backend/category/CategoryRepository.java
```

현재 API에서 필요한 동작:

```text
GET /api/categories?companyId= : companyId 기준 조회, name 오름차순
POST /api/categories : name + companyId 중복 방지
DELETE /api/categories?id= : 존재 확인 후 삭제
```

필요 메서드:

```java
List<Category> findByCompanyIdOrderByNameAsc(Integer companyId);
boolean existsByNameAndCompanyId(String name, Integer companyId);
Optional<Category> findById(Integer id);
```

구현 초안:

```java
package com.finel.backend.category;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findByCompanyIdOrderByNameAsc(Integer companyId);
    boolean existsByNameAndCompanyId(String name, Integer companyId);
}
```

3단계에서는 `ProductRepository.countByCategoryId(id)` Repository 메서드 자체를 검증한다. 4단계 이후 카테고리 삭제 Service에서는 `ProductReader.countByCategoryId(id)`처럼 product 도메인의 조회 컴포넌트를 통해 호출한다.

## Product Entity 명세

위치:

```text
backend/src/main/java/com/finel/backend/product/Product.java
```

역할:

```text
제품 정보 저장
Category와 N:1 관계
목록/상세/검색 응답의 핵심 데이터 제공
```

필드:

| 필드 | Java 타입 | DB 컬럼 | 제약 |
| --- | --- | --- | --- |
| id | Integer | id | PK, auto increment |
| name | String | name | not null |
| categoryId | Category 관계 | categoryId | FK, not null |
| spec | String | spec | not null |
| description | String | description | TEXT, not null |
| imageUrl | String | imageUrl | not null |
| isVisible | Boolean | isVisible | not null, default true |
| createdAt | LocalDateTime | createdAt | not null |
| updatedAt | LocalDateTime | updatedAt | not null |

구현 초안:

```java
package com.finel.backend.product;

import com.finel.backend.category.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "\"Product\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "\"categoryId\"", nullable = false)
    private Category category;

    @Column(name = "spec", nullable = false)
    private String spec;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "\"imageUrl\"", nullable = false)
    private String imageUrl;

    @Column(name = "\"isVisible\"", nullable = false)
    private Boolean isVisible = true;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isVisible == null) {
            isVisible = true;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

주의:

```text
Prisma의 @updatedAt 동작은 JPA의 @PreUpdate로 맞춘다.
Product.category는 LAZY로 둔다.
목록/상세 조회처럼 category가 필요한 경우 Repository에서 EntityGraph 또는 fetch join을 사용한다.
Product에 categoryId 필드를 별도 Integer로 중복 선언하지 않는다.
```

## Product Repository 명세

위치:

```text
backend/src/main/java/com/finel/backend/product/ProductRepository.java
```

현재 API에서 필요한 동작:

```text
GET /api/products 공개 목록 : isVisible=true 제품, createdAt 최신순, category 포함
GET /api/products?includeHidden=true 관리자 목록 : 전체 제품, createdAt 최신순, category 포함
GET /api/products/{id} : 단일 제품, category 포함
GET /api/products/search?q= : 공개 제품만, 이름 부분 일치, 대소문자 무시, 최대 10개, 최신순
DELETE /api/categories?id= : 특정 category에 속한 제품 개수 확인
```

필요 메서드:

```java
List<Product> findAllByOrderByCreatedAtDesc();
List<Product> findByIsVisibleTrueOrderByCreatedAtDesc();
Optional<Product> findWithCategoryById(Integer id);
List<Product> searchVisibleProducts(String query, Pageable pageable);
long countByCategoryId(Integer categoryId);
```

구현 초안:

```java
package com.finel.backend.product;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    @EntityGraph(attributePaths = "category")
    List<Product> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findByIsVisibleTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    @Query("""
        select p
        from Product p
        where p.id = :id
    """)
    Optional<Product> findWithCategoryById(Integer id);

    @EntityGraph(attributePaths = "category")
    @Query("""
        select p
        from Product p
        where p.isVisible = true
          and lower(p.name) like lower(concat('%', :query, '%'))
        order by p.createdAt desc
    """)
    List<Product> searchVisibleProducts(@Param("query") String query, Pageable pageable);

    @Query("""
        select count(p)
        from Product p
        where p.category.id = :categoryId
    """)
    long countByCategoryId(@Param("categoryId") Integer categoryId);
}
```

검색 호출 예시:

```java
PageRequest.of(0, 10)
```

3단계에서는 Repository 메서드가 정상 동작하는지 테스트만 한다. 응답 DTO 변환은 4단계 API 구현에서 처리한다.

주의:

```text
findAllByOrderByCreatedAtDesc()는 관리자 전체 목록용 Repository 메서드다.
공개 API GET /api/products는 4단계에서 findByIsVisibleTrueOrderByCreatedAtDesc()를 사용한다.
검색 API는 이미 searchVisibleProducts()에서 isVisible=true를 강제한다.
```

## Inquiry Entity 명세

위치:

```text
backend/src/main/java/com/finel/backend/inquiry/Inquiry.java
```

역할:

```text
고객 문의 저장
관리자 문의 목록 조회
관리자 문의 삭제
```

필드:

| 필드 | Java 타입 | DB 컬럼 | 제약 |
| --- | --- | --- | --- |
| id | Integer | id | PK, auto increment |
| name | String | name | not null |
| phone | String | phone | nullable |
| email | String | email | not null |
| content | String | content | TEXT, not null |
| company | String | company | nullable |
| product | String | product | nullable |
| isRead | Boolean | isRead | not null, default false |
| createdAt | LocalDateTime | createdAt | not null |

구현 초안:

```java
package com.finel.backend.inquiry;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "\"Inquiry\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "company")
    private String company;

    @Column(name = "product")
    private String product;

    @Column(name = "\"isRead\"", nullable = false)
    private Boolean isRead = false;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}
```

문의 등록 API는 현재 다음 입력 alias를 허용한다.

```text
phoneNumber 또는 phone
message 또는 content
productName 또는 product
```

이 alias 처리는 Entity가 아니라 4단계의 Request DTO/Service에서 처리한다. Entity에는 DB 컬럼명 기준 필드만 둔다.

## Inquiry Repository 명세

위치:

```text
backend/src/main/java/com/finel/backend/inquiry/InquiryRepository.java
```

현재 API에서 필요한 동작:

```text
GET /api/inquiries : createdAt 최신순 조회
POST /api/inquiries : 문의 저장
DELETE /api/inquiries/{id} : 문의 삭제
```

필요 메서드:

```java
List<Inquiry> findAllByOrderByCreatedAtDesc();
```

구현 초안:

```java
package com.finel.backend.inquiry;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryRepository extends JpaRepository<Inquiry, Integer> {
    List<Inquiry> findAllByOrderByCreatedAtDesc();
}
```

## 생성자/정적 팩토리 기준

3단계에서 저장 테스트까지 작성한다면 Entity 생성 경로가 필요하다.

권장 방식:

```text
protected no-args constructor: JPA 전용
public static create(...): 도메인 생성용
public update(...): 수정용
```

Category 예시:

```java
public static Category create(String name, Integer companyId) {
    Category category = new Category();
    category.name = name;
    category.companyId = companyId;
    return category;
}
```

Product 예시:

```java
public static Product create(
    String name,
    Category category,
    String spec,
    String description,
    String imageUrl
) {
    Product product = new Product();
    product.name = name;
    product.category = category;
    product.spec = spec;
    product.description = description == null ? "" : description;
    product.imageUrl = imageUrl == null ? "" : imageUrl;
    product.isVisible = true;
    return product;
}
```

Inquiry 예시:

```java
public static Inquiry create(
    String name,
    String phone,
    String email,
    String content,
    String company,
    String product
) {
    Inquiry inquiry = new Inquiry();
    inquiry.name = name;
    inquiry.phone = phone;
    inquiry.email = email == null || email.isBlank() ? "" : email;
    inquiry.content = content;
    inquiry.company = company;
    inquiry.product = product;
    inquiry.isRead = false;
    return inquiry;
}
```

주의:

```text
필드별 public setter는 만들지 않는다.
API validation은 Entity가 아니라 Request DTO에서 처리한다.
Entity create 메서드는 DB 기본값과 API 기본값이 어긋나지 않게 최소한의 기본값만 보정한다.
Inquiry.email은 DB not null이므로 null 또는 blank 입력 시 빈 문자열 ""로 저장한다.
Inquiry.phone, company, product는 DB nullable이므로 null을 유지해도 된다.
Product.description, imageUrl은 DB not null이므로 null 입력 시 빈 문자열 ""로 보정한다.
```

## 기존 API 응답을 위한 조회 데이터

3단계 Repository는 4단계 API 구현에서 다음 응답을 만들 수 있어야 한다.

### 제품 목록/상세

기존 응답은 Product에 Category 객체를 그대로 내려보내지 않고 `category`, `companyId`를 평탄화한다.

```json
{
  "id": 1,
  "name": "제품명",
  "spec": "제품 사양",
  "description": "설명",
  "imageUrl": "https://...",
  "isVisible": true,
  "createdAt": "...",
  "updatedAt": "...",
  "category": "카테고리명",
  "companyId": 1
}
```

따라서 Product 조회 시 Category가 함께 로딩되어야 한다.

필수:

```text
findAllByOrderByCreatedAtDesc()에 @EntityGraph(attributePaths = "category")
findWithCategoryById()에 @EntityGraph(attributePaths = "category")
searchVisibleProducts()에 @EntityGraph(attributePaths = "category")
```

### 카테고리 목록

기존 응답:

```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "카테고리",
      "companyId": 1
    }
  ]
}
```

Category 조회에서 products 목록은 필요 없다.

### 문의 목록

기존 응답:

```json
{
  "success": true,
  "inquiries": [
    {
      "id": 1,
      "name": "홍길동",
      "phone": "010...",
      "email": "",
      "content": "문의 내용",
      "company": "",
      "product": "",
      "isRead": false,
      "createdAt": "..."
    }
  ]
}
```

Inquiry는 다른 Entity와 관계가 없다.

## DB 연결 기준

Spring Boot DB 연결은 기존 `DATABASE_URL`을 그대로 쓰지 않고 JDBC 형식으로 변환한다.

예시:

```text
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_URL=jdbc:postgresql://host:5432/dbname
DB_USERNAME=user
DB_PASSWORD=password
```

`application-local.yml` 예시:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
```

`open-in-view: false`를 사용한다. Category가 필요한 Product 조회는 Repository에서 fetch join 또는 EntityGraph로 명시한다.

## 마이그레이션 금지 기준

3단계에서는 DB 스키마 변경을 하지 않는다.

금지 작업:

```text
Prisma migrate 실행
Prisma db push 실행
Hibernate ddl-auto update/create 사용
Flyway/Liquibase 마이그레이션 추가
운영 DB에서 DDL 실행
```

허용 작업:

```text
로컬/개발 DB 연결 확인
기존 테이블 read 테스트
테스트 DB에서 @Transactional rollback 기반 Repository save/delete 검증
기존 seed 데이터 조회 확인
```

운영 DB 접속 정보가 `.env`에 있어도 3단계 구현 검증은 운영 DB가 아닌 복제된 개발 DB나 로컬 DB를 우선한다.

DB 보호 규칙:

```text
실제 개발 DB 테스트는 기본적으로 @Transactional rollback을 사용한다.
테스트가 생성한 데이터는 이름/username/content 등에 TEST_ 또는 __test__ prefix를 붙인다.
테스트가 생성한 데이터만 삭제할 수 있다.
기존 seed 데이터는 조회만 가능하며 수정/삭제하지 않는다.
운영 DB URL 또는 운영 DB로 의심되는 host가 감지되면 테스트를 중단한다.
테스트에서 truncate, delete from 전체 테이블, drop, alter, create DDL을 실행하지 않는다.
```

운영 DB 차단 기준:

```text
SPRING_PROFILES_ACTIVE=test가 아니면 Repository 통합 테스트를 실행하지 않는다.
DB_URL에 production, prod 또는 운영 DB로 확정된 프로젝트명/host가 포함되면 테스트를 실패시킨다.
Neon을 쓰더라도 테스트용 branch/project인지 명확하지 않으면 테스트를 실행하지 않는다.
운영/개발 DB 구분이 애매하면 테스트를 실행하지 않는다.
```

## 테스트 명세

테스트는 Repository 중심으로 작성한다.

위치:

```text
backend/src/test/java/com/finel/backend/
├─ auth/AdminRepositoryTest.java
├─ category/CategoryRepositoryTest.java
├─ product/ProductRepositoryTest.java
└─ inquiry/InquiryRepositoryTest.java
```

테스트 방식은 두 가지 중 하나를 선택한다.

테스트 profile은 분리한다.

```text
backend/src/test/resources/application-test.yml
SPRING_PROFILES_ACTIVE=test
```

`application-test.yml` 기준:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
```

테스트 실행 기본값은 `test` profile을 사용한다. 실제 DB 접속 정보는 로컬 개발자 환경 변수 또는 별도 비공개 설정으로만 주입하고, 저장소에 커밋하지 않는다.

### 선택지 A: 실제 PostgreSQL 개발 DB

장점:

```text
Prisma가 만든 실제 PostgreSQL 스키마와 JPA 매핑을 바로 검증 가능
quoted table/column 문제를 정확히 발견 가능
```

주의:

```text
운영 DB 사용 금지
@Transactional rollback 필수
테스트 데이터 prefix 필수
기존 seed 데이터 수정/삭제 금지
```

### 선택지 B: Testcontainers PostgreSQL

장점:

```text
로컬 개발 환경 재현성 높음
테스트가 서로 독립적
```

주의:

```text
Docker 필요
Prisma 스키마와 동일한 DDL 또는 마이그레이션 준비 필요
```

초기 3단계에서는 선택지 A로 빠르게 매핑을 검증할 수 있다. 다만 이 경우 외부 개발 DB 상태에 의존하므로 `.\gradlew test`가 항상 재현 가능하다고 가정하지 않는다.

CI나 반복 실행 안정성이 필요하면 다음처럼 분리한다.

```text
test: DB 없이 가능한 단위/컨텍스트 테스트
integrationTest: 실제 PostgreSQL 또는 Testcontainers 기반 Repository 통합 테스트
```

3단계에서 `integrationTest` task를 분리하지 않는다면, Repository 테스트는 `test` profile과 안전한 개발 DB URL이 있을 때만 실행되도록 조건을 둔다.

## 테스트 데이터 준비 기준

Repository 테스트는 seed 기반 조회 테스트와 fixture 생성 테스트를 분리한다.

### seed 기반 조회 테스트

목적:

```text
기존 Prisma seed 데이터와 JPA 매핑이 호환되는지 확인
quoted identifier, nullable, 기본 관계 매핑 문제 발견
```

규칙:

```text
seed 데이터는 조회만 한다.
seed 데이터의 id, username, name을 하드코딩하지 않는다.
테스트 시작 시 Repository로 첫 데이터를 찾고, 없으면 테스트를 skip하거나 명확한 실패 메시지를 낸다.
seed 데이터는 수정/삭제하지 않는다.
```

### fixture 생성 테스트

목적:

```text
Entity create 메서드, @PrePersist, @PreUpdate, save/delete 동작 검증
```

규칙:

```text
@Transactional rollback을 기본으로 한다.
테스트 데이터 이름은 TEST_ 또는 __test__ prefix를 사용한다.
Category/Product fixture는 테스트 안에서 직접 생성한다.
Product fixture는 테스트가 생성한 Category만 참조한다.
Inquiry fixture는 테스트가 직접 생성한다.
테스트가 생성하지 않은 데이터는 delete 하지 않는다.
```

## Repository 테스트 케이스

### AdminRepositoryTest

검증:

```text
username으로 관리자 조회 가능
없는 username은 Optional.empty 반환
password가 bcrypt hash 형태로 저장되어 있음
```

데이터 기준:

```text
seed 기반 조회 테스트로 작성한다.
기존 관리자 계정은 조회만 한다.
관리자 save/delete 테스트는 3단계 필수가 아니다.
관리자 username을 하드코딩하지 말고, 존재하는 첫 Admin 또는 테스트 설정값 TEST_ADMIN_USERNAME을 사용한다.
```

테스트 예시:

```text
findByUsername_existingAdmin_returnsAdmin
findByUsername_unknownAdmin_returnsEmpty
```

### CategoryRepositoryTest

검증:

```text
companyId 기준으로 카테고리 조회
name 오름차순 정렬
name + companyId 중복 여부 확인
```

데이터 기준:

```text
조회/정렬 검증은 seed 기반 조회 테스트로 작성할 수 있다.
existsByNameAndCompanyId 검증은 seed 데이터 조회 또는 @Transactional fixture 생성으로 작성한다.
중복 저장 실패까지 검증하려면 테스트가 생성한 TEST_ Category만 사용하고 rollback한다.
```

테스트 예시:

```text
findByCompanyIdOrderByNameAsc_returnsSortedCategories
existsByNameAndCompanyId_existingCategory_returnsTrue
```

### ProductRepositoryTest

검증:

```text
관리자 전체 목록 메서드는 전체 제품을 createdAt 최신순으로 조회함
공개 목록 메서드는 isVisible=true 제품만 createdAt 최신순으로 조회함
제품 조회 시 category가 함께 로딩됨
검색은 isVisible=true만 반환
검색은 이름 부분 일치와 대소문자 무시를 만족
검색은 최대 10개만 반환
categoryId 기준 제품 수 count 가능
```

데이터 기준:

```text
목록/상세/검색 조회는 seed 기반 조회 테스트로 작성할 수 있다.
save/delete 검증이 필요하면 테스트가 직접 생성한 TEST_ Category와 TEST_ Product만 사용한다.
기존 Product나 Category는 삭제하지 않는다.
공개 API 정책 검증은 4단계 Controller/Service 테스트에서 다시 확인한다.
```

테스트 예시:

```text
findAllByOrderByCreatedAtDesc_returnsAllProductsWithCategoryForAdmin
findByIsVisibleTrueOrderByCreatedAtDesc_returnsVisibleProductsOnly
findWithCategoryById_existingProduct_returnsProductWithCategory
searchVisibleProducts_query_returnsVisibleProductsOnly
countByCategoryId_existingCategory_returnsProductCount
```

### InquiryRepositoryTest

검증:

```text
문의 목록이 createdAt 최신순으로 조회됨
문의 저장 시 isRead 기본값 false
문의 저장 시 createdAt 자동 설정
email null 또는 blank 입력 시 빈 문자열로 저장
문의 삭제 가능
```

데이터 기준:

```text
목록 조회는 seed 기반 조회 테스트로 작성할 수 있다.
save/delete는 @Transactional fixture 생성 테스트로 작성한다.
삭제 테스트는 테스트가 생성한 TEST_ Inquiry만 대상으로 한다.
기존 문의 데이터는 삭제하지 않는다.
```

테스트 예시:

```text
findAllByOrderByCreatedAtDesc_returnsNewestFirst
save_newInquiry_setsDefaults
save_newInquiry_withoutEmail_storesEmptyString
delete_existingInquiry_removesInquiry
```

## 검증 명령

3단계 구현 후 backend 폴더에서 실행한다.

```powershell
.\gradlew test
```

Repository 통합 테스트가 실제 PostgreSQL 개발 DB를 사용한다면 `test` profile과 안전한 DB 환경 변수를 명시한다.

```powershell
$env:SPRING_PROFILES_ACTIVE="test"
$env:DB_URL="jdbc:postgresql://localhost:5432/finel_test"
$env:DB_USERNAME="..."
$env:DB_PASSWORD="..."
.\gradlew test
```

`integrationTest` task를 분리했다면 Repository 통합 테스트는 다음 명령으로 실행한다.

```powershell
.\gradlew integrationTest
```

애플리케이션 시작 확인:

```powershell
.\gradlew bootRun --args='--spring.profiles.active=local'
```

검증 기준:

```text
ApplicationContext 로딩 성공
Hibernate validate 통과
Repository 테스트 통과
Repository 통합 테스트가 test profile에서만 실행됨
기존 PostgreSQL 테이블에 DDL 변경 없음
```

## 예상 문제와 처리 기준

### 테이블을 찾지 못하는 경우

증상:

```text
relation "product" does not exist
```

원인:

```text
Prisma 테이블은 "Product"인데 Hibernate가 product로 조회
```

처리:

```text
@Table(name = "\"Product\"") 확인
quoted identifier 적용 확인
```

### 컬럼을 찾지 못하는 경우

증상:

```text
column product0_.created_at does not exist
```

원인:

```text
createdAt 컬럼을 Hibernate가 created_at으로 변환
```

처리:

```text
@Column(name = "\"createdAt\"") 명시
@Column(name = "\"categoryId\"") 명시
@Column(name = "\"isVisible\"") 명시
```

### LazyInitializationException

증상:

```text
could not initialize proxy - no Session
```

원인:

```text
open-in-view=false 상태에서 Product.category를 Service/DTO 변환 시점에 접근
```

처리:

```text
ProductRepository 조회 메서드에 @EntityGraph(attributePaths = "category") 추가
또는 JPQL fetch join 사용
```

### validate 실패

증상:

```text
Schema-validation: missing table/column
```

처리 순서:

```text
1. 실제 DB 테이블명/컬럼명 확인
2. Entity @Table/@Column 이름 확인
3. Prisma schema와 DB 상태 차이 확인
4. ddl-auto를 update로 바꾸지 말고 매핑을 수정
```

## 도메인 명세서 갱신 항목

3단계 구현 시 `backend/docs/` 도메인 명세서에도 DB 모델 정보를 추가한다.

### auth-spec.md

추가:

```text
Admin 테이블 매핑
findByUsername 사용 목적
password는 bcrypt hash 저장
createdAt은 DB 생성 시점 기준
```

### category-spec.md

추가:

```text
Category 테이블 매핑
name + companyId 복합 유니크
companyId 기준 name 오름차순 조회
제품 연결 시 삭제 금지
```

### product-spec.md

추가:

```text
Product 테이블 매핑
Category N:1 관계
관리자 전체 목록용 createdAt 최신순 전체 조회
공개 목록용 isVisible=true createdAt 최신순 조회
isVisible=true 검색 조건
검색 최대 10개
Prisma @updatedAt을 JPA @PreUpdate로 대체
```

### inquiry-spec.md

추가:

```text
Inquiry 테이블 매핑
createdAt 최신순 목록 조회
isRead 기본값 false
email은 DB not null이므로 null 또는 blank 입력 시 빈 문자열 저장
phone/company/product는 DB nullable이므로 null 허용
```

## 완료 기준

3단계는 다음 조건을 만족하면 완료로 본다.

```text
Admin, Category, Product, Inquiry Entity 구현 완료
각 Entity가 Prisma/PostgreSQL 테이블과 정확히 매핑됨
AdminRepository, CategoryRepository, ProductRepository, InquiryRepository 구현 완료
Product-Category 관계 조회가 정상 동작
Inquiry 저장/조회/삭제가 Repository 수준에서 동작
Category별 Product count가 가능
Hibernate ddl-auto validate 통과
Repository 테스트 통과
실제 DB 구조 확인 쿼리 결과와 Entity 매핑이 일치
Repository 테스트는 test profile에서 실행되고 운영 DB URL이면 중단됨
실제 개발 DB save/delete 테스트는 @Transactional rollback 또는 테스트 fixture 한정 삭제 기준을 지킴
운영 DB 스키마 변경 없음
도메인별 명세서에 DB 모델 정보 반영
```

## 다음 단계 연결

3단계가 끝나면 4단계에서 공개 API를 구현한다.

4단계 대상:

```text
GET  /api/products
GET  /api/products/{id}
GET  /api/products/search?q=
GET  /api/categories?companyId=
POST /api/inquiries
```

4단계에서는 3단계 Repository를 사용해 DTO를 만들고, 기존 Next.js API 응답 형태를 최대한 그대로 맞춘다.
