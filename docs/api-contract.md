# API 계약 문서

작성일: 2026-05-28

## 1. 문서 목적

이 문서는 Finel 프로젝트를 Spring Boot 백엔드로 이전하기 전에, 현재 Next.js API Route가 제공하는 API 계약을 정리한 문서다.

주니어 개발자는 이 문서를 기준으로 Spring Boot Controller, DTO, Service, Repository를 만들면 된다.

목표는 새로운 API를 멋지게 재설계하는 것이 아니라, 현재 Next.js 프론트엔드가 기대하는 요청/응답 형태를 최대한 그대로 유지하는 것이다.

## 2. 현재 서버 구조

현재 프로젝트는 Python 서버가 아니다.

```text
Next.js App Router
├─ 화면: src/app, src/components
├─ API 서버: src/app/api/**/route.ts
├─ 인증 보호: src/proxy.ts
├─ DB 접근: src/lib/prisma.ts
└─ DB 스키마: prisma/schema.prisma
```

Spring 전환 후 목표 구조:

```text
Next.js
└─ 프론트엔드만 담당

Spring Boot
└─ REST API 서버 담당

PostgreSQL
└─ 기존 데이터 저장소
```

## 3. 기본 API 규칙

### Base URL

현재 프론트는 같은 Next.js 서버 안의 상대 경로를 호출한다.

```ts
fetch('/api/products')
```

Spring 전환 후에는 다음처럼 API 서버 주소를 붙여야 한다.

```ts
fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`)
```

초기 로컬 개발 기준:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

따라서 로컬 API Base URL은 다음과 같이 잡을 수 있다.

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Content-Type

JSON body를 보내는 API는 다음 헤더를 사용한다.

```http
Content-Type: application/json
```

### 날짜 직렬화

기존 Next.js API 응답은 날짜를 UTC 기준 ISO-8601 문자열로 반환한다.

```text
2026-05-27T10:00:00.000Z
```

Spring 이전 후에도 프론트 호환을 위해 Response DTO에서는 날짜를 문자열로 변환해 이 형태를 맞춘다. Entity의 `LocalDateTime`을 그대로 JSON 직렬화하지 않는다.

날짜/시간 변환 기준:

- PostgreSQL의 기존 Prisma `DateTime` 컬럼은 UTC 시각으로 간주한다.
- JPA Entity에서는 DB 매핑 안정성을 위해 `LocalDateTime`을 사용할 수 있다.
- Response DTO 변환 계층에서 `LocalDateTime`에 `ZoneOffset.UTC`를 적용해 `Instant`로 변환한 뒤 `.000Z` 형태 문자열로 직렬화한다.
- 서버 JVM 기본 타임존을 사용해 `Z`를 붙이지 않는다.
- 신규 생성/수정 시각은 `Clock.systemUTC()` 또는 동등한 UTC 기준 clock으로 만든다.

### Spring 환경 변수

Spring Boot 전환 시 사용하는 주요 환경 변수:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
MAIL_TO
MAIL_HOST
MAIL_PORT
FRONTEND_ORIGIN
```

### 공통 성공 응답

현재 API는 대부분 `success: true`를 포함한다.

```json
{
  "success": true
}
```

Spring 이전 시에도 프론트 변경을 줄이려면 `success` 필드를 유지한다.

### 공통 실패 응답

현재 API는 대부분 `success: false`와 `message`를 반환한다.

```json
{
  "success": false,
  "message": "오류 메시지"
}
```

Spring에서도 최소한 다음 두 필드는 유지한다.

```json
{
  "success": false,
  "message": "사용자에게 보여줄 수 있는 메시지"
}
```

공통 응답 구현 기준:

- `ApiResponse`는 여러 도메인에서 공통으로 쓰는 단순 성공/실패 응답에만 사용한다.
- 기본 필드는 `success`, `message`로 제한한다.
- 목록/상세 응답의 `products`, `categories`, `inquiries`, `product` 같은 데이터 필드는 각 도메인 Response DTO에서 명시한다.
- `ErrorResponse`의 기본 필드는 `success`, `message`다.
- `errorCode`, `stage`는 문의 등록처럼 프론트가 단계별 실패를 구분해야 하는 API에서만 추가한다.
- `inquirySaved`는 문의 등록 API 전용 필드이며 전역 공통 응답 필드로 승격하지 않는다.
- 문의 DB 저장 실패에서는 `inquirySaved=false`, 메일 발송 실패에서는 `inquirySaved=true`를 반환한다.

### 인증 방식

현재 관리자 인증은 `auth_token` httpOnly 쿠키 기반이다.

```text
Cookie: auth_token=<JWT>
```

Spring 전환 초기에는 이 방식을 유지하는 것이 가장 안전하다.

확정 JWT 기준:

```text
algorithm: HS256
lifetime: 43,200초
claims: id, username, iat, exp
secret: 최소 32바이트
implementation: Spring Security OAuth2 Resource Server + Nimbus JOSE
```

Auth 전환 배포에서는 기존 Next.js 세션을 만료시키고 한 번 재로그인한다.

Spring에서 필요한 설정:

- 로그인 성공 시 `Set-Cookie: auth_token=...` 응답
- 쿠키 옵션: `HttpOnly`, `Path=/`
- 로컬 개발 기본값: `SameSite=Lax`, `Secure=false`
- 운영에서 프론트와 백엔드가 같은 site이면 `SameSite=Lax`, `Secure=true`
- 운영은 same-site custom domain 또는 same-origin reverse proxy로 배포
- 서로 다른 site의 cookie 인증은 서드파티 쿠키 차단 때문에 지원하지 않음
- 프론트와 백엔드 origin이 다르면 CORS credentials 허용 필요
- 관리자 API 요청에서 쿠키를 읽어 JWT 검증
- Spring Security CSRF 활성화
- `GET /api/auth/csrf`가 발급한 token을 상태 변경 요청의 `X-XSRF-TOKEN` header로 전송

프론트에서 `http://localhost:3000` → `http://localhost:8080`처럼 cross-origin으로 직접 호출하면 쿠키가 자동으로 포함되지 않는다.

이 경우 관리자 API뿐 아니라 로그인/로그아웃/검증 요청에도 다음 옵션을 붙인다.

```ts
fetch(url, {
  credentials: 'include',
})
```

Spring CORS 설정도 다음 조건을 만족해야 한다.

```text
allowedOrigins: http://localhost:3000
allowCredentials: true
allowedMethods: GET, POST, PATCH, DELETE, OPTIONS
allowedHeaders: Content-Type, X-XSRF-TOKEN
```

같은 도메인 프록시를 쓰면 이 변경을 줄일 수 있다.

## 4. DB 모델 기준

현재 Prisma 모델은 다음 네 가지다.

```text
Admin
Category
Product
Inquiry
```

Spring Boot에서는 다음처럼 옮긴다.

```text
auth/
├─ AuthController.java
├─ AuthService.java
├─ Admin.java
├─ AdminRepository.java
└─ dto/

product/
├─ ProductController.java
├─ ProductService.java
├─ Product.java
├─ ProductRepository.java
├─ ProductReader.java
└─ dto/

category/
├─ CategoryController.java
├─ CategoryService.java
├─ Category.java
├─ CategoryRepository.java
├─ CategoryReader.java
└─ dto/

inquiry/
├─ InquiryController.java
├─ InquiryService.java
├─ InquiryPersistenceService.java
├─ Inquiry.java
├─ InquiryRepository.java
└─ dto/

mail/
├─ MailService.java
└─ MailProperties.java

common/
├─ error/
└─ web/

config/
```

패키지는 `spring-boot-step2-skeleton-spec.md`의 도메인 단위 구조를 기준으로 한다. `entity/`, `repository/`, `service/`, `controller/` 같은 최상위 계층형 패키지는 만들지 않는다.

### Admin

현재 Prisma:

```prisma
model Admin {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

Spring Entity 필드:

```text
id: Long 또는 Integer
username: String, unique
password: String
createdAt: LocalDateTime
```

주의:

- `password`는 평문이 아니라 bcrypt hash로 저장되어야 한다.
- 로그인 API에서는 `BCryptPasswordEncoder.matches(rawPassword, encodedPassword)` 형태로 비교한다.

### Category

현재 Prisma:

```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String
  companyId Int
  products  Product[]

  @@unique([name, companyId])
}
```

Spring Entity 필드:

```text
id: Long 또는 Integer
name: String
companyId: Integer
products: List<Product>
```

DB 제약:

```text
unique(name, company_id)
```

주의:

- 회사별 카테고리이므로 `name`만 unique가 아니다.
- 같은 이름이라도 다른 `companyId`면 허용된다.

현재 회사 ID:

```text
1: imi
2: sns pneumatic
3: cypag
4: parker
5: kcc
```

### Product

현재 Prisma:

```prisma
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
```

Spring Entity 필드:

```text
id: Long 또는 Integer
name: String
category: Category
spec: String
description: String
imageUrl: String
isVisible: Boolean
createdAt: LocalDateTime
updatedAt: LocalDateTime
```

주의:

- API 응답에서는 `category` 객체를 그대로 내려주지 않고 카테고리명 문자열로 바꾸는 경우가 많다.
- 프론트는 `product.category`를 문자열로 기대한다.
- 프론트는 `companyId`도 제품 응답에 포함되기를 기대한다.

### Inquiry

현재 Prisma:

```prisma
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

Spring Entity 필드:

```text
id: Long 또는 Integer
name: String
phone: String
email: String
content: String
company: String
product: String
isRead: Boolean
createdAt: LocalDateTime
```

주의:

- 현재 프론트에서는 `email` 입력을 required로 받지만 서버는 문의 등록 검증에서 `email`을 필수로 보지 않는다.
- 서버가 실제로 필수 검증하는 값은 `name`, `phoneNumber 또는 phone`, `message 또는 content`다.
- 기존 Prisma 모델의 `email`은 non-null이므로 Spring 전환 중 운영 DB 스키마는 바꾸지 않는다.
- 문의 등록 요청에 `email`이 없거나 빈 값이면 DB에는 빈 문자열 `''`로 저장한다.

## 5. API 전체 목록

| 영역 | Method | Path | 인증 | 설명 |
| --- | --- | --- | --- | --- |
| Auth | POST | `/api/auth/login` | 공개 | 관리자 로그인 |
| Auth | GET | `/api/auth/logout` | 공개 | 관리자 로그아웃 |
| Auth | GET | `/api/auth/verify` | 관리자 | 현재 토큰 검증 |
| Auth | GET | `/api/auth/csrf` | 공개 | CSRF token 발급 |
| Products | GET | `/api/products` | 공개 | 공개 제품 목록 |
| Products | GET | `/api/products?includeHidden=true` | 관리자 | 관리자 제품 전체 목록 |
| Products | GET | `/api/products?categoryId=` | 공개 | 카테고리별 공개 제품 목록 |
| Products | GET | `/api/products/featured?limit=` | 공개 | 메인 노출용 최신 공개 제품 |
| Products | POST | `/api/products` | 관리자 | 제품 등록 |
| Products | GET | `/api/products/{id}` | 공개 | 제품 상세 |
| Products | PATCH | `/api/products/{id}` | 관리자 | 제품 수정 |
| Products | DELETE | `/api/products/{id}` | 관리자 | 제품 삭제 |
| Products | GET | `/api/products/search?q=` | 공개 | 제품 검색 |
| Categories | GET | `/api/categories?companyId=` | 공개 | 회사별 카테고리 목록 |
| Categories | GET | `/api/categories/{id}` | 공개 | 카테고리 상세 |
| Categories | POST | `/api/categories` | 관리자 | 카테고리 등록 |
| Categories | DELETE | `/api/categories?id=` | 관리자 | 카테고리 삭제 |
| SEO | GET | `/api/sitemap-data` | 공개 | sitemap 생성용 제품/카테고리 데이터 |
| Inquiries | GET | `/api/inquiries` | 관리자 | 문의 목록 |
| Inquiries | POST | `/api/inquiries` | 공개 | 문의 등록 |
| Inquiries | DELETE | `/api/inquiries/{id}` | 관리자 | 문의 삭제 |

## 6. 인증 API

## 6.1 POST `/api/auth/login`

관리자 로그인 API다.

현재 호출 위치:

```text
src/app/admin/login/page.tsx
```

Request:

로그인 전에 `GET /api/auth/csrf`를 호출하고 다음 header를 보낸다.

```http
X-XSRF-TOKEN: <csrf-token>
```

```json
{
  "username": "admin",
  "password": "password"
}
```

검증:

- `username` 필수
- `password` 필수
- DB에서 `username`으로 Admin 조회
- bcrypt로 password 검증
- 최소 32바이트 `JWT_SECRET` 필요

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "message": "로그인 성공"
}
```

Success cookie:

```http
Set-Cookie: auth_token=<jwt>; HttpOnly; Path=/; Max-Age=43200; SameSite=Lax
```

쿠키 환경별 정책:

- 로컬 개발: `SameSite=Lax`, `Secure=false`, `Domain` 미설정
- 운영 same-site 배포: `SameSite=Lax`, `Secure=true`, 필요할 때만 `Domain` 설정
- 운영 cross-site 배포: 지원하지 않음. same-site custom domain 또는 reverse proxy로 변경
- `SameSite=Strict`는 프론트와 백엔드가 다른 site일 때 관리자 인증을 깨뜨릴 수 있으므로 기본값으로 쓰지 않는다.

Fail examples:

필드 누락:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "아이디와 비밀번호를 입력해주세요."
}
```

로그인 실패:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "아이디 또는 비밀번호가 올바르지 않습니다."
}
```

서버 설정 오류:

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "서버 설정 오류"
}
```

Spring 구현 힌트:

```text
AuthController.login()
→ AuthService.login(username, password)
→ AdminRepository.findByUsername(username)
→ BCryptPasswordEncoder.matches()
→ JwtTokenProvider.createToken()
→ ResponseCookie 생성
```

## 6.2 GET `/api/auth/logout`

관리자 로그아웃 API다.

현재 호출 위치:

```text
src/app/admin/page.tsx
```

Request:

```http
GET /api/auth/logout
```

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "message": "Logged out"
}
```

Cookie 처리:

```http
Set-Cookie: auth_token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

로그아웃 쿠키 만료 응답도 로그인 시 사용한 `SameSite`, `Secure`, `Domain` 정책과 동일한 속성을 붙인다. 쿠키 삭제는 이름, Path, Domain이 발급 시점과 일치해야 한다.

Spring 구현 힌트:

```text
AuthController.logout()
→ 같은 이름의 auth_token 쿠키를 만료 처리
```

주의:

- 현재 API는 GET으로 로그아웃한다.
- Spring에서 REST스럽게 바꾸면 POST가 더 적절하지만, 프론트 변경을 줄이려면 우선 GET 유지가 안전하다.

## 6.3 GET `/api/auth/verify`

현재 로그인 상태를 확인하는 API다.

현재 보호:

```text
auth_token 쿠키 필요
```

Request:

```http
GET /api/auth/verify
Cookie: auth_token=<jwt>
```

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "iat": 1710000000,
    "exp": 1710043200
  }
}
```

Fail response:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "인증 토큰이 없습니다."
}
```

또는:

```json
{
  "success": false,
  "message": "유효하지 않은 토큰입니다."
}
```

Spring 구현 힌트:

```text
AuthController.verify()
→ 쿠키에서 auth_token 추출
→ JWT 검증
→ payload 반환
```

## 6.4 GET `/api/auth/csrf`

로그인과 관리자 변경 요청에 사용할 CSRF token 발급 API다.

```http
GET /api/auth/csrf
```

```json
{
  "token": "<csrf-token>",
  "headerName": "X-XSRF-TOKEN"
}
```

응답은 `XSRF-TOKEN` cookie를 함께 발급한다. `auth_token`은 HttpOnly를 유지하고 `XSRF-TOKEN`만 프론트에서 읽을 수 있다. 공개 문의 등록 `POST /api/inquiries`는 cookie 인증을 사용하지 않으므로 CSRF 검사에서 제외한다.

## 7. 제품 API

## 7.1 GET `/api/products`

공개 제품 목록 조회 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
src/app/products/page.tsx
src/app/contact/page.tsx
```

Request:

```http
GET /api/products
```

인증:

```text
필요 없음
```

공개 상세 정책:

```text
isVisible=true 제품만 조회한다.
isVisible=false 제품은 존재하더라도 404로 처리한다.
이 API는 선택적 인증을 하지 않는다.
관리자 숨김 제품 상세가 필요하면 별도 관리자 API를 새로 명세한다.
유효하지 않은 auth_token 쿠키가 있어도 무시하고 공개 visible 조회만 수행한다.
```

DB 조회:

```text
Product 중 isVisible = true만 조회
createdAt desc 정렬
Category join 포함
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
      "name": "제품명",
      "categoryId": 10,
      "category": "카테고리명",
      "companyId": 1,
      "spec": "220V / 60Hz",
      "description": "제품 설명",
      "imageUrl": "https://res.cloudinary.com/.../image.png",
      "isVisible": true,
      "createdAt": "2026-05-27T10:00:00.000Z",
      "updatedAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

중요 응답 규칙:

- `category`는 객체가 아니라 문자열이다.
- `companyId`는 `product.category.companyId`에서 꺼내 제품 응답 최상위에 넣는다.
- 사용자 제품 목록과 문의 제품 선택은 이 응답을 사용한다.
- `isVisible=false` 제품은 공개 페이지에 노출하지 않는다.
- 관리자 전체 목록은 `GET /api/products?includeHidden=true`를 사용하며 관리자 인증이 필요하다.

관리자 전체 목록 요청:

```http
GET /api/products?includeHidden=true
Cookie: auth_token=<jwt>
```

관리자 전체 목록 규칙:

- 인증된 관리자만 호출할 수 있다.
- `isVisible=true`, `isVisible=false` 제품을 모두 반환한다.
- 응답 형태는 공개 목록과 동일하게 유지한다.
- Spring 전환 시 관리자 화면의 제품 목록 호출은 이 query를 붙이도록 함께 수정한다.

Spring DTO 예시:

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

Spring 구현 힌트:

```text
ProductController.getProducts()
→ includeHidden=true이면 관리자 인증 확인
→ ProductService.getProducts(includeHidden)
→ includeHidden=true이면 ProductRepository.findAllByOrderByCreatedAtDesc()
→ 기본값이면 ProductRepository.findByIsVisibleTrueOrderByCreatedAtDesc()
→ ProductResponse로 변환
```

## 7.1.1 GET `/api/products?categoryId=`

카테고리별 공개 제품 목록 조회 API다. Prisma 직접 사용 제거를 위해 `src/app/products/category/[id]/page.tsx`에서 사용한다.

Request:

```http
GET /api/products?categoryId=10
```

인증:

```text
필요 없음
```

조회:

```text
categoryId 필수
categoryId에 해당하는 Category가 존재해야 함
isVisible = true만 조회
createdAt desc 정렬
Category join 포함
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

Fail:

```text
400 Bad Request: categoryId 누락 또는 숫자 변환 실패
400 Bad Request: includeHidden=true와 categoryId를 함께 사용
404 Not Found: 카테고리를 찾을 수 없습니다.
```

주의:

```text
categoryId에 해당하는 카테고리가 존재하지만 제품이 없으면 200 OK와 빈 products 배열을 반환한다.
includeHidden=true와 categoryId를 함께 쓰는 관리자 필터는 이번 계약에서 금지한다.
필요하면 관리자 제품 필터 명세에서 별도 확장한다.
```

Spring 구현 힌트:

```text
ProductController.getProducts(categoryId, includeHidden)
→ categoryId와 includeHidden=true가 함께 있으면 400
→ CategoryReader.getCategoryForProduct(categoryId)로 카테고리 존재 확인
→ ProductService.getVisibleProductsByCategory(categoryId)
→ ProductRepository.findByCategoryIdAndIsVisibleTrueOrderByCreatedAtDesc(categoryId)
→ ProductResponse로 변환
```

## 7.1.2 GET `/api/products/featured?limit=`

메인 페이지 최신 공개 제품 조회 API다. Prisma 직접 사용 제거를 위해 `src/app/page.tsx`에서 사용한다.

Request:

```http
GET /api/products/featured?limit=4
```

인증:

```text
필요 없음
```

조회:

```text
isVisible = true만 조회
createdAt desc 정렬
limit 기본값 4
limit 최대값 12
Category join 포함
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

Fail:

```text
400 Bad Request: limit 숫자 변환 실패
```

Spring 구현 힌트:

```text
ProductController.getFeaturedProducts(limit)
→ limit 없으면 4
→ limit > 12이면 12로 clamp
→ ProductService.getFeaturedProducts(limit)
→ ProductRepository.findFeaturedVisibleProducts(PageRequest.of(0, limit))
→ ProductResponse로 변환
```

## 7.2 POST `/api/products`

제품 등록 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

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
  "imageUrl": "https://res.cloudinary.com/.../image.png"
}
```

주의:

- 현재 프론트의 `categoryId`는 문자열일 수 있다.
- 서버는 `Number(categoryId)`로 변환한다.
- `description`, `imageUrl`은 빈 문자열 허용.
- 생성 시 `isVisible`은 항상 `true`.

필수 검증:

```text
name 필수
categoryId 필수
spec 필수
```

Fail response:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "제품명과 카테고리, 사양은 필수입니다."
}
```

Success status:

```text
201 Created
```

Success response:

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
    "imageUrl": "https://res.cloudinary.com/.../image.png",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

Spring Request DTO 예시:

```java
public record ProductCreateRequest(
    String name,
    String categoryId,
    String spec,
    String description,
    String imageUrl
) {}
```

Spring 구현 힌트:

```text
ProductController.createProduct()
→ 인증 필터 통과 필요
→ ProductService.createProduct()
→ CategoryReader.getCategoryForProduct(categoryId)
→ Product 저장
→ ProductResponse 반환
```

도메인 경계:

- `ProductService`는 `CategoryRepository`를 직접 주입하지 않는다.
- 카테고리 존재 확인과 응답 조립에 필요한 카테고리 조회는 `category` 도메인의 `CategoryReader` 또는 `CategoryService`를 통해 수행한다.

## 7.3 GET `/api/products/{id}`

제품 상세 조회 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

주의:

- `src/app/products/[id]/page.tsx`는 현재 이 API를 호출하지 않고 Prisma로 직접 제품을 조회한다.
- Spring 전환 후 Next.js를 프론트엔드만 담당하게 만들려면 이 페이지도 `GET /api/products/{id}` 또는 별도 서버 API 클라이언트로 바꿔야 한다.

Request:

```http
GET /api/products/1
```

인증:

```text
필요 없음
```

Success response:

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
    "imageUrl": "https://res.cloudinary.com/.../image.png",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

Not found:

```http
404 Not Found
```

```json
{
  "success": false,
  "message": "해당 제품을 찾을 수 없습니다."
}
```

Spring 구현 힌트:

```text
ProductController.getProduct(id)
→ ProductService.getProduct(id)
→ 없거나 isVisible=false이면 404
→ ProductResponse 반환
```

## 7.4 PATCH `/api/products/{id}`

제품 수정 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

인증:

```text
관리자 필요
```

Request:

```json
{
  "name": "수정 제품명",
  "categoryId": 10,
  "spec": "수정 사양",
  "description": "수정 설명",
  "imageUrl": "https://res.cloudinary.com/.../new.png"
}
```

가능 필드:

```text
name
categoryId
spec
description
imageUrl
isVisible
```

현재 검증 규칙:

```text
name: 1자 이상, 100자 이하
categoryId: 양수 정수
spec: 200자 이하
description: 문자열
imageUrl: URL 또는 빈 문자열
isVisible: boolean
```

수정할 필드가 하나도 없으면:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "수정할 내용이 없습니다."
}
```

Success response:

```json
{
  "success": true,
  "message": "제품 정보가 수정되었습니다.",
  "product": {
    "id": 1,
    "name": "수정 제품명",
    "categoryId": 10,
    "spec": "수정 사양",
    "description": "수정 설명",
    "imageUrl": "https://res.cloudinary.com/.../new.png",
    "isVisible": true,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T11:00:00.000Z"
  }
}
```

주의:

- 현재 수정 응답의 `product`는 등록/조회 응답처럼 `category`, `companyId`를 평탄화하지 않는다.
- 프론트는 수정 성공 후 `fetchProducts()`로 목록을 다시 불러오기 때문에 현재는 큰 문제가 없다.
- Spring에서는 일관성을 위해 `ProductResponse`로 맞춰도 된다. 단, 프론트 영향은 확인한다.

Spring Request DTO 예시:

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

Spring 구현 힌트:

```text
ProductController.updateProduct(id, request)
→ 관리자 인증 필요
→ Product 조회
→ null이 아닌 필드만 수정
→ categoryId가 있으면 Category 조회 후 교체
→ 저장
```

## 7.5 DELETE `/api/products/{id}`

제품 삭제 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

인증:

```text
관리자 필요
```

Request:

```http
DELETE /api/products/1
```

Success response:

```json
{
  "success": true,
  "message": "제품이 삭제되었습니다."
}
```

Fail response:

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "제품 삭제 실패"
}
```

Spring 구현 힌트:

```text
ProductController.deleteProduct(id)
→ 관리자 인증 필요
→ Product 존재 확인
→ 삭제
```

개선 가능:

- 존재하지 않는 ID는 404로 반환하는 것이 더 좋다.
- 단, 기존 프론트는 삭제 응답을 자세히 보지 않고 화면 목록에서 제거한다.

## 7.6 GET `/api/products/search?q=keyword`

제품 검색 API다.

현재 호출 위치:

```text
src/components/ProductSearch.tsx
```

Request:

```http
GET /api/products/search?q=실린더
```

인증:

```text
필요 없음
```

Query:

```text
q: 검색어
```

현재 처리:

- 검색어 trim
- 최대 100자
- 빈 검색어면 빈 배열 반환
- 제품명 부분 일치
- 대소문자 무시
- `isVisible = true` 제품만 검색
- 최대 10개
- `createdAt desc` 정렬

빈 검색어 response:

```json
{
  "success": true,
  "products": []
}
```

Success response:

```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "제품명",
      "imageUrl": "https://res.cloudinary.com/.../image.png",
      "category": "카테고리명"
    }
  ]
}
```

Spring DTO 예시:

```java
public record ProductSearchResponse(
    Integer id,
    String name,
    String imageUrl,
    String category
) {}
```

Spring 구현 힌트:

```text
ProductController.searchProducts(q)
→ q trim, length 제한
→ 빈 값이면 []
→ ProductRepository 검색 메서드 호출
→ ProductSearchResponse 변환
```

Repository 메서드 예시:

```java
List<Product> findTop10ByNameContainingIgnoreCaseAndIsVisibleTrueOrderByCreatedAtDesc(String name);
```

## 8. 카테고리 API

## 8.1 GET `/api/categories?companyId=`

회사별 카테고리 조회 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
src/app/products/page.tsx
```

Request:

```http
GET /api/categories?companyId=1
```

인증:

```text
필요 없음
```

Query:

```text
companyId: 필수
```

Success response:

```json
{
  "success": true,
  "categories": [
    {
      "id": 10,
      "name": "실린더",
      "companyId": 1
    }
  ]
}
```

필수값 누락:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "회사 ID가 필요합니다."
}
```

정렬:

```text
name asc
```

Spring 구현 힌트:

```text
CategoryController.getCategories(companyId)
→ companyId 없으면 400
→ CategoryRepository.findByCompanyIdOrderByNameAsc(companyId)
```

현재 주의할 점:

- `src/app/products/page.tsx`는 현재 `fetch('/api/categories')`를 호출한다.
- 그런데 현재 API는 `companyId`가 없으면 400을 반환한다.
- 이 페이지는 카테고리 API 실패 시 제품 목록에서 카테고리명을 fallback으로 추출한다.
- 결정: Spring 이전 후에도 400을 유지한다.
- `GET /api/categories`를 전체 카테고리 조회 API로 확장하지 않는다.
- `src/app/products/page.tsx`의 무파라미터 호출은 제거하고, 전체 카테고리 UI가 필요하면 `GET /api/products` 응답의 `category/companyId`에서 그룹을 만든다.

## 8.1.1 GET `/api/categories/{id}`

카테고리 상세 조회 API다. Prisma 직접 사용 제거를 위해 `src/app/products/category/[id]/page.tsx`의 metadata와 화면 제목에서 사용한다.

Request:

```http
GET /api/categories/10
```

인증:

```text
필요 없음
```

Success status:

```text
200 OK
```

Success response:

```json
{
  "success": true,
  "category": {
    "id": 10,
    "name": "카테고리명",
    "companyId": 1
  }
}
```

Fail:

```text
400 Bad Request: id 숫자 변환 실패
404 Not Found: 카테고리를 찾을 수 없습니다.
```

Spring 구현 힌트:

```text
CategoryController.getCategory(id)
→ CategoryService.getCategory(id)
→ CategoryRepository.findById(id)
→ CategoryResponse로 변환
```

## 8.2 POST `/api/categories`

카테고리 생성 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

인증:

```text
관리자 필요
```

Request:

```json
{
  "name": "새 카테고리",
  "companyId": 1
}
```

검증:

```text
name: 1자 이상
companyId: 정수
```

Success status:

```text
201 Created
```

Success response:

```json
{
  "success": true,
  "message": "카테고리가 추가되었습니다.",
  "category": {
    "id": 10,
    "name": "새 카테고리",
    "companyId": 1
  }
}
```

호환성:

```text
현재 Next.js API는 success와 category만 반환하고 message가 없을 수 있다.
Spring 전환 후에는 사용자 피드백 일관성을 위해 message를 추가한다.
프론트가 message에 의존하지 않더라도 Spring API 계약은 위 형태로 고정한다.
```

Validation fail:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "카테고리 이름은 필수 항목입니다."
}
```

Spring 구현 힌트:

```text
CategoryController.createCategory()
→ 관리자 인증 필요
→ request validation
→ unique(name, companyId) 중복 확인 또는 DB 예외 처리
→ 저장
```

중복 처리 권장:

```http
409 Conflict
```

```json
{
  "success": false,
  "message": "이미 존재하는 카테고리입니다."
}
```

현재 Next.js 코드에는 중복 DB 예외를 별도로 409로 변환하지 않는다. Spring에서는 개선해도 되지만 프론트 메시지 처리는 확인한다.

## 8.3 DELETE `/api/categories?id=`

카테고리 삭제 API다.

현재 호출 위치:

```text
src/hooks/useProductAdmin.ts
```

인증:

```text
관리자 필요
```

Request:

```http
DELETE /api/categories?id=10
```

Query:

```text
id: 필수
```

필수값 누락:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "카테고리 ID가 필요합니다."
}
```

제품이 연결되어 있는 경우:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "해당 카테고리에 속한 제품이 있어 삭제할 수 없습니다."
}
```

Success response:

```json
{
  "success": true,
  "message": "카테고리가 삭제되었습니다."
}
```

Spring 구현 힌트:

```text
CategoryController.deleteCategory(id)
→ 관리자 인증 필요
→ ProductReader.countByCategoryId(id)
→ count > 0이면 400
→ Category 삭제
```

도메인 경계:

- `CategoryController`와 `CategoryService`는 `ProductRepository`를 직접 주입하지 않는다.
- 제품 연결 여부 확인은 `product` 도메인의 `ProductReader` 또는 `ProductService`를 통해 수행한다.

개선 가능:

- REST 스타일로는 `DELETE /api/categories/{id}`가 더 좋다.
- 하지만 현재 프론트 변경을 줄이려면 query 방식 유지가 안전하다.

## 9. 문의 API

## 9.1 GET `/api/inquiries`

관리자 문의 목록 조회 API다.

현재 호출 위치:

```text
src/hooks/useInquiry.ts
```

인증:

```text
관리자 필요
```

Request:

```http
GET /api/inquiries
Cookie: auth_token=<jwt>
```

DB 조회:

```text
Inquiry 전체 조회
createdAt desc 정렬
```

Success response:

```json
{
  "success": true,
  "inquiries": [
    {
      "id": 1,
      "name": "홍길동",
      "phone": "010-1234-5678",
      "email": "help@company.com",
      "content": "문의 내용",
      "company": "회사명",
      "product": "제품명",
      "isRead": false,
      "createdAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

Spring 구현 힌트:

```text
InquiryController.getInquiries()
→ 관리자 인증 필요
→ InquiryRepository.findAllByOrderByCreatedAtDesc()
```

## 9.2 POST `/api/inquiries`

고객 문의 등록 API다.

현재 호출 위치:

```text
src/app/contact/page.tsx
```

인증:

```text
필요 없음
```

현재 프론트 Request:

```json
{
  "name": "홍길동",
  "email": "help@company.com",
  "phone": "010-1234-5678",
  "product": "제품명",
  "company": "회사명",
  "content": "문의 내용"
}
```

서버는 과거 필드명도 같이 허용한다.

허용 입력 필드:

```text
name
phoneNumber
email
message
productName
company
phone
content
product
```

서버 내부 매핑:

```text
phoneNumber = rawPhoneNumber ?? phone ?? ''
message = rawMessage ?? content ?? ''
productName = rawProductName ?? product ?? ''
```

필수 검증:

```text
name 필수
phoneNumber 또는 phone 필수
message 또는 content 필수
```

주의:

- 현재 서버 검증상 email은 필수가 아니다.
- 현재 화면에서는 email input이 required라 사용자는 필수로 입력한다.
- Spring에서는 기존 서버 호환성을 우선해 email optional로 둔다.
- 기존 DB 스키마의 `email`은 non-null이므로 email 미입력 또는 blank 입력 시 빈 문자열 `''`로 저장한다.
- 운영 DB 스키마를 nullable로 변경하지 않는다.

Validation fail:

```http
400 Bad Request
```

```json
{
  "success": false,
  "errorCode": "VALIDATION_FAILED",
  "stage": "VALIDATION",
  "message": "이름, 연락처, 문의 내용은 필수 입력 항목입니다."
}
```

DB 저장 실패:

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "errorCode": "DB_WRITE_FAILED",
  "stage": "DB_WRITE",
  "message": "문의 저장에 실패했습니다.",
  "inquirySaved": false
}
```

정책:

```text
DB 저장 실패는 문의가 저장되지 않은 상태이므로 inquirySaved=false를 명시한다.
메일 발송 실패는 문의가 저장된 상태이므로 inquirySaved=true를 명시한다.
```

메일 발송 실패:

```http
502 Bad Gateway
```

```json
{
  "success": false,
  "errorCode": "MAIL_SEND_FAILED",
  "stage": "MAIL_SEND",
  "inquirySaved": true,
  "inquiryId": 1,
  "message": "문의는 접수되었지만 알림 발송에 실패했습니다."
}
```

SMTP exception message, response code, command 같은 내부 정보는 공개 응답에 포함하지 않는다. 서버 로그에는 `inquiryId`, exception class와 안전하게 정제한 message만 기록한다.

Success status:

```text
201 Created
```

Success response:

```json
{
  "success": true,
  "stage": "DONE",
  "message": "문의가 성공적으로 접수되었습니다.",
  "mailSent": true,
  "inquiry": {
    "id": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "email": "help@company.com",
    "content": "문의 내용",
    "company": "회사명",
    "product": "제품명",
    "isRead": false,
    "createdAt": "2026-05-27T10:00:00.000Z"
  }
}
```

Spring Request DTO 예시:

```java
public record InquiryCreateRequest(
    String name,
    String phoneNumber,
    String email,
    String message,
    String productName,
    String company,
    String phone,
    String content,
    String product
) {}
```

Spring 구현 힌트:

```text
InquiryController.createInquiry()
→ request에서 phone/message/product 정규화
→ 필수값 검증
→ Inquiry 저장
→ MailService.sendInquiryMail()
→ 성공/메일 실패 응답 분리
```

중요:

- 현재 프론트는 `res.ok || data.inquirySaved`이면 사용자에게 성공으로 안내한다.
- 따라서 메일 발송 실패라도 `inquirySaved: true`가 있으면 사용자는 문의 접수 성공으로 본다.
- Spring에서도 이 동작을 유지해야 현재 UX가 깨지지 않는다.

메일 내용 현재 포함 정보:

```text
이름
연락처
이메일
회사명
문의 내용
```

현재 메일에는 관심 제품명이 포함되지 않는다. 필요하면 Spring 이전 때 추가 개선 후보로 남긴다.

## 9.3 DELETE `/api/inquiries/{id}`

문의 삭제 API다.

현재 호출 위치:

```text
src/hooks/useInquiry.ts
```

인증:

```text
관리자 필요
```

Request:

```http
DELETE /api/inquiries/1
```

잘못된 ID:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "잘못된 ID입니다."
}
```

Success response:

```json
{
  "success": true,
  "message": "문의 내역이 삭제되었습니다."
}
```

Fail response:

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

Spring 구현 힌트:

```text
InquiryController.deleteInquiry(id)
→ 관리자 인증 필요
→ id 숫자 검증은 path variable binding으로 처리 가능
→ Inquiry 존재 확인
→ 삭제
```

개선 가능:

- 존재하지 않는 ID는 404로 반환하는 것이 좋다.

## 10. SEO/정적 데이터 API

## 10.1 GET `/api/sitemap-data`

Next.js `src/app/sitemap.ts`가 Prisma 없이 sitemap URL을 생성하기 위한 공개 meta API다. 백엔드 도메인 명세는 `backend/docs/public-meta-spec.md`를 따른다.

Request:

```http
GET /api/sitemap-data
```

인증:

```text
필요 없음
```

조회:

```text
isVisible = true 제품만 포함
카테고리 전체 포함
제품 updatedAt 포함
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

주의:

```text
이 API는 화면 표시용 상세 데이터를 반환하지 않는다.
sitemap 생성에 필요한 최소 필드만 반환한다.
숨김 제품은 sitemap에 포함하지 않는다.
```

Spring 구현 힌트:

```text
PublicMetaController.getSitemapData()
→ PublicMetaService.getSitemapData()
→ ProductRepository.findVisibleSitemapItems()
→ CategoryRepository.findAllCategorySitemapItems()
→ SitemapDataResponse로 변환
```

## 11. 관리자 보호 규칙

현재 `src/proxy.ts` 기준 보호 규칙:

```text
/admin
/admin/**
```

로그인 페이지 제외:

```text
/admin/login
```

API 보호:

```text
GET    /api/products              공개
POST   /api/products              관리자
GET    /api/products/{id}         공개
PATCH  /api/products/{id}         관리자
DELETE /api/products/{id}         관리자
GET    /api/products/search       공개

GET    /api/categories            공개
POST   /api/categories            관리자
DELETE /api/categories            관리자

GET    /api/inquiries             관리자
POST   /api/inquiries             공개
DELETE /api/inquiries/{id}        관리자
```

Spring 인증 전환 후 `/admin` 페이지 보호 결정:

```text
Next.js는 JWT를 직접 검증하지 않는다.
src/proxy.ts는 auth_token 쿠키를 Spring GET /api/auth/verify로 전달해 200/401만 판단한다.
verify 성공이면 /admin 접근 허용.
verify 실패이면 /admin/login으로 redirect하고 auth_token 삭제.
src/lib/admin-auth.ts의 JWT_SECRET 기반 검증은 Spring 전환 완료 후 제거한다.
Next.js 런타임에 JWT_SECRET을 필수로 두지 않는다.
```

주의:

```text
/admin 페이지 guard는 UX 보호다.
보안의 최종 경계는 Spring 관리자 API의 401 응답이다.
프론트 guard가 있어도 Spring 관리자 API 보호를 생략하지 않는다.
```

Spring Security에서는 다음처럼 생각하면 된다.

```text
permitAll:
  GET  /api/auth/csrf
  POST /api/auth/login
  GET  /api/auth/logout
  GET  /api/products
  GET  /api/products/search
  GET  /api/products/featured
  GET  /api/products/*
  GET  /api/categories
  GET  /api/categories/*
  GET  /api/sitemap-data
  POST /api/inquiries

authenticated admin:
  GET    /api/auth/verify
  POST   /api/products
  PATCH  /api/products/*
  DELETE /api/products/*
  POST   /api/categories
  DELETE /api/categories
  GET    /api/inquiries
  DELETE /api/inquiries/*
```

CSRF는 인가와 별도로 적용한다. 로그인과 authenticated admin의 POST/PATCH/DELETE는 `X-XSRF-TOKEN`이 없으면 403을 반환한다. Security matcher는 query parameter를 구분하지 않으므로 `GET /api/products?includeHidden=true`의 관리자 검증은 Controller/Service에서도 반드시 수행한다.

주의:

- `/api/products/search`가 `/api/products/{id}`보다 먼저 매칭되어야 한다.
- Spring MVC에서는 명확한 mapping이면 큰 문제는 없지만, 보안 matcher 작성 시 순서를 조심한다.

## 12. 프론트 호출 위치 정리

Spring 이전 시 아래 API 호출 파일들을 수정하게 된다.

```text
src/app/admin/login/page.tsx
src/app/admin/page.tsx
src/app/contact/page.tsx
src/app/products/page.tsx
src/components/ProductSearch.tsx
src/hooks/useInquiry.ts
src/hooks/useProductAdmin.ts
```

현재 브라우저 fetch 호출 목록:

```text
POST   /api/auth/login
GET    /api/auth/logout
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PATCH  /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q=
GET    /api/categories?companyId=
GET    /api/categories
POST   /api/categories
DELETE /api/categories?id=
GET    /api/inquiries
POST   /api/inquiries
DELETE /api/inquiries/{id}
```

추가로, 아래 파일들은 API fetch가 아니라 Prisma를 직접 사용한다.

Spring 전환 후 Next.js가 프론트엔드만 담당하게 하려면 이 파일들도 반드시 수정해야 한다.

```text
src/app/page.tsx
src/app/products/[id]/page.tsx
src/app/products/category/[id]/page.tsx
src/app/sitemap.ts
```

직접 Prisma 사용처별 전환 방향:

```text
src/app/page.tsx
  - 현재: 최신 공개 제품 4개를 Prisma로 조회
  - 전환: GET /api/products/featured?limit=4 사용

src/app/products/[id]/page.tsx
  - 현재: 제품 상세와 SEO metadata를 Prisma로 조회
  - 전환: GET /api/products/{id} 사용

src/app/products/category/[id]/page.tsx
  - 현재: 카테고리와 해당 공개 제품 목록을 Prisma로 조회
  - 전환: GET /api/categories/{id} + GET /api/products?categoryId={id} 사용

src/app/sitemap.ts
  - 현재: 제품/카테고리 URL 생성을 Prisma로 조회
  - 전환: GET /api/sitemap-data 사용
```

Prisma 제거용 정식 추가 API:

```text
GET /api/categories/{id}
GET /api/products/featured?limit=4
GET /api/products?categoryId={id}
GET /api/sitemap-data
```

권장 프론트 정리:

```text
src/lib/api/client.ts
src/lib/api/auth.ts
src/lib/api/products.ts
src/lib/api/categories.ts
src/lib/api/inquiries.ts
```

예시:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}
```

주의:

- Cloudinary 업로드는 백엔드 API가 아니라 외부 API다.
- `https://api.cloudinary.com/v1_1/.../image/upload` 호출은 Spring 이전 대상이 아니다.
- 나중에 보안을 강화하려면 Spring에서 signed upload를 발급하는 구조로 바꿀 수 있다.
- GET/HEAD 요청에는 기본 `Content-Type`을 붙이지 않는다.
- JSON body가 있는 요청에만 `Content-Type: application/json`을 붙인다.

## 13. Spring 구현 순서

주의:

```text
전체 실행 순서의 master sequence는 docs/migration-runbook.md를 따른다.
아래 순서는 API 계약 문서 작성 당시의 백엔드 구현 관점 요약인 legacy rough sequence이며, 실행 단계 번호로 사용하지 않는다.
```

처음 구현할 때는 아래 순서가 가장 쉽다.

### 1단계: 프로젝트 생성

필요 의존성:

```text
Spring Web
Spring Data JPA
Spring Security
Spring Security OAuth2 Resource Server
PostgreSQL Driver
Validation
Java Mail Sender
Lombok
```

Java 버전:

```text
Java 21 LTS
Spring Boot 3.5.15
Gradle Wrapper 8.14.5
```

초기 패키지 예시:

```text
com.finel.backend
├─ auth
├─ product
├─ category
├─ inquiry
├─ common
└─ config
```

### 2단계: Entity와 Repository

먼저 DB 모델을 만든다.

```text
Admin
Category
Product
Inquiry
```

Repository:

```text
AdminRepository.findByUsername()
CategoryRepository.findByCompanyIdOrderByNameAsc()
ProductRepository.findByIsVisibleTrueOrderByCreatedAtDesc()
ProductRepository.findAllByOrderByCreatedAtDesc()
ProductRepository.findTop10ByNameContainingIgnoreCaseAndIsVisibleTrueOrderByCreatedAtDesc()
InquiryRepository.findAllByOrderByCreatedAtDesc()
```

도메인 간 조회:

- 다른 도메인의 Repository를 직접 주입하지 않는다.
- 제품 도메인에서 카테고리가 필요하면 `CategoryReader` 또는 `CategoryService`를 사용한다.
- 카테고리 도메인에서 제품 개수가 필요하면 `ProductReader` 또는 `ProductService`를 사용한다.

### 3단계: 공개 조회 API

인증이 없는 API부터 만든다.

```text
GET /api/products
GET /api/products/{id}
GET /api/products/search
GET /api/categories?companyId=
```

이 단계가 끝나면 사용자 제품 목록과 검색부터 연결할 수 있다.

### 4단계: 문의 등록 API

```text
POST /api/inquiries
```

먼저 DB 저장만 구현한다.

그 다음 메일 발송을 붙인다.

메일 발송 실패 시에도 `inquirySaved: true`를 반환하는 계약을 유지한다.

### 5단계: 인증 API

```text
POST /api/auth/login
GET /api/auth/logout
GET /api/auth/verify
GET /api/auth/csrf
```

이 단계에서 JWT 쿠키와 Spring Security 필터를 구현한다.

### 6단계: 관리자 변경 API

```text
POST /api/products
PATCH /api/products/{id}
DELETE /api/products/{id}
POST /api/categories
DELETE /api/categories?id=
GET /api/inquiries
DELETE /api/inquiries/{id}
```

인증 필터가 안정된 다음 구현한다.

## 14. 테스트 체크리스트

Spring API를 만든 뒤 Postman, curl, 또는 IntelliJ HTTP Client로 아래를 확인한다.

### 공개 API

```text
GET /api/products
GET /api/products/1
GET /api/products/search?q=test
GET /api/categories?companyId=1
POST /api/inquiries
```

확인 기준:

- status code가 현재 계약과 같은가
- `success` 필드가 있는가
- 제품 응답의 `category`가 문자열인가
- 제품 응답의 `companyId`가 있는가
- 문의 등록 후 DB에 저장되는가
- 메일 실패 시에도 `inquirySaved: true`가 내려오는가

### 인증 API

```text
POST /api/auth/login
GET /api/auth/verify
GET /api/auth/logout
```

확인 기준:

- 로그인 성공 시 `auth_token` 쿠키가 생기는가
- 잘못된 비밀번호는 401인가
- verify는 쿠키가 없으면 401인가
- logout 후 쿠키가 만료되는가

### 관리자 API

```text
POST /api/products
PATCH /api/products/1
DELETE /api/products/1
POST /api/categories
DELETE /api/categories?id=1
GET /api/inquiries
DELETE /api/inquiries/1
```

확인 기준:

- 쿠키 없이 호출하면 401인가
- 로그인 쿠키가 있으면 정상 처리되는가
- 카테고리에 제품이 있으면 삭제가 막히는가
- 삭제 후 목록 조회에서 사라지는가

## 15. 현재 발견된 주의사항

### `/api/categories` 파라미터 없는 호출

`src/app/products/page.tsx`에서 다음 호출이 있다.

```ts
fetch('/api/categories')
```

하지만 현재 API는 `companyId`가 없으면 400을 반환한다.

현재 화면은 카테고리 API 실패 시 제품 목록에서 카테고리명을 추출해서 fallback으로 사용한다.

Spring 이전 때 선택지:

1. 기존처럼 400을 유지한다.
2. `companyId`가 없으면 전체 카테고리를 반환하도록 개선한다.
3. 프론트에서 회사 선택 후에만 `companyId`를 붙여 호출하도록 수정한다.

초기 이전에서는 1번이 가장 변경이 적다.

결정:

```text
1번으로 확정한다.
GET /api/categories 무파라미터 호출은 400 Bad Request를 유지한다.
전체 카테고리 조회로 확장하지 않는다.
src/app/products/page.tsx의 무파라미터 호출은 Spring 전환 시 제거한다.
제품 페이지에서 전체 카테고리 UI가 필요하면 GET /api/products 응답의 category/companyId를 기반으로 프론트에서 그룹을 만든다.
```

### Product update 응답 불일치

제품 생성/조회 응답은 `category`, `companyId`가 평탄화되어 있다.

하지만 현재 PATCH 응답은 Prisma update 결과를 그대로 반환하므로 `category`, `companyId`가 없다.

현재 프론트는 수정 후 목록을 다시 조회하기 때문에 큰 문제는 없다.

Spring에서는 모든 제품 응답을 `ProductResponse`로 통일하는 것을 권장한다.

### 문의 메일에 product가 빠져 있음

문의 등록 request에는 `product`가 들어오고 DB에도 저장한다.

하지만 메일 HTML에는 현재 관심 제품명이 포함되어 있지 않다.

Spring 이전 시 개선 후보:

```text
메일 내용에 productName 추가
```

단, 이것은 API 계약 변경은 아니고 운영 편의 개선이다.

### `isRead` 변경 API 없음

`Inquiry` 모델에는 `isRead`가 있지만 현재 읽음 처리 API는 없다.

Spring 이전 범위에는 포함하지 않는다.

필요하면 나중에 추가한다.

```text
PATCH /api/inquiries/{id}/read
```

## 16. API 계약 정리 완료 기준

이 문서를 기준으로 다음 질문에 답할 수 있으면 API 계약 정리는 완료다.

- 어떤 API가 있는가
- 어떤 API가 관리자 인증을 요구하는가
- 각 API의 request body는 무엇인가
- 각 API의 response body는 무엇인가
- Spring DTO를 어떤 식으로 만들면 되는가
- 어떤 프론트 파일이 어떤 API를 호출하는가
- Spring 이전 시 조심해야 할 현재 버그/불일치는 무엇인가

다음 단계는 Spring Boot 프로젝트 뼈대를 만들기 전에 `backend/`를 같은 저장소에 둘지, 별도 저장소로 분리할지 결정하는 것이다.
