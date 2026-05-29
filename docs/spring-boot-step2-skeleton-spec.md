# 2단계 Spring Boot 뼈대 생성 명세

작성일: 2026-05-29

## 목표

2단계의 목표는 실제 기능 구현이 아니라 Spring Boot 백엔드 프로젝트를 어떤 구조로 만들지 먼저 확정하는 것이다.

이번 단계에서는 컨트롤러, 서비스, 리포지토리, 엔티티, DTO의 빈 skeleton 파일까지 만든다. 다만 실제 API 로직, DB 접근 로직, 인증 로직, 메일 발송 로직은 구현하지 않는다.

목표는 이후 구현이 흔들리지 않도록 패키지 구조, 도메인 경계, 공통 영역, 설정 파일 기준을 정하고, 컴파일과 로컬 실행이 가능한 Spring Boot 뼈대를 확보하는 것이다.

## 핵심 방향

폴더 구조는 `controller`, `service`, `repository`, `dto`처럼 계층별로 나누지 않는다.

대신 기능과 도메인 단위로 묶는다.

예를 들면 다음과 같은 방식이다.

```text
나쁜 방향
├─ controller
├─ service
├─ repository
├─ dto
└─ entity

좋은 방향
├─ auth
├─ product
├─ category
├─ inquiry
└─ mail
```

이 프로젝트에서는 로그인, 제품, 카테고리, 문의, 메일 발송이 각각 독립적인 기능 단위다. 따라서 각 도메인 폴더 안에 해당 기능의 controller, service, dto, entity, repository를 함께 둔다.

또한 각 도메인별 명세서를 `backend/docs/` 아래에 둔다. 전체 API 계약은 루트의 `docs/api-contract.md`에서 관리하되, 구현자가 실제로 작업할 때 필요한 세부 규칙은 `backend/docs/`의 도메인별 명세서에서 바로 확인할 수 있게 한다.

## 생성 위치

Spring Boot 프로젝트는 현재 Next.js 프로젝트 안에 `backend/` 폴더로 만든다.

```text
finel/
├─ src/                  # 기존 Next.js 프론트엔드
├─ docs/
├─ prisma/
└─ backend/              # 2단계에서 만들 Spring Boot 백엔드
```

처음에는 같은 저장소 안에서 관리한다. 프론트엔드와 백엔드 분리가 안정화된 뒤 필요하면 별도 저장소 분리를 검토한다.

## 기술 스택 기준

```text
Language: Java 21
Framework: Spring Boot 3.x
Build: Gradle
Database: PostgreSQL
ORM: Spring Data JPA
Security: Spring Security
Validation: Jakarta Bean Validation
Mail: Spring Mail
```

Java는 21을 우선한다. 배포 환경에서 Java 21 사용이 어렵다면 Java 17로 낮춘다.

## 의존성

초기 뼈대에 포함할 의존성은 다음으로 제한한다.

```text
Spring Web
Spring Data JPA
Spring Security
PostgreSQL Driver
Validation
Spring Mail
Lombok
```

JWT 라이브러리는 인증 구현 단계에서 추가한다. 2단계 뼈대 생성 시점에는 의존성 후보만 명시하고, 실제 토큰 구현은 관리자 인증 이전 단계에서 확정한다.

2단계에서 `Spring Data JPA`와 PostgreSQL Driver는 이후 단계의 의존성 기준을 고정하기 위해 포함한다. 다만 2단계의 로컬 실행 검증은 DB 연결 없이도 성공해야 한다.

## 최상위 패키지

기본 패키지는 다음으로 둔다.

```text
com.finel.backend
```

전체 애플리케이션 시작 클래스는 최상위 패키지 바로 아래에 둔다.

```text
backend/src/main/java/com/finel/backend/FinelBackendApplication.java
```

## 목표 폴더 구조

```text
backend/
├─ gradlew
├─ gradlew.bat
├─ gradle/
│  └─ wrapper/
├─ build.gradle
├─ settings.gradle
├─ docs/
│  ├─ auth-spec.md
│  ├─ product-spec.md
│  ├─ category-spec.md
│  ├─ inquiry-spec.md
│  └─ mail-spec.md
├─ src/
│  ├─ main/
│  │  ├─ java/
│  │  │  └─ com/
│  │  │     └─ finel/
│  │  │        └─ backend/
│  │  │           ├─ FinelBackendApplication.java
│  │  │           ├─ auth/
│  │  │           │  ├─ AuthController.java
│  │  │           │  ├─ AuthService.java
│  │  │           │  ├─ Admin.java
│  │  │           │  ├─ AdminRepository.java
│  │  │           │  └─ dto/
│  │  │           │     ├─ LoginRequest.java
│  │  │           │     ├─ LoginResponse.java
│  │  │           │     └─ VerifyResponse.java
│  │  │           ├─ product/
│  │  │           │  ├─ ProductController.java
│  │  │           │  ├─ ProductService.java
│  │  │           │  ├─ Product.java
│  │  │           │  ├─ ProductRepository.java
│  │  │           │  └─ dto/
│  │  │           │     ├─ ProductCreateRequest.java
│  │  │           │     ├─ ProductUpdateRequest.java
│  │  │           │     └─ ProductResponse.java
│  │  │           ├─ category/
│  │  │           │  ├─ CategoryController.java
│  │  │           │  ├─ CategoryService.java
│  │  │           │  ├─ Category.java
│  │  │           │  ├─ CategoryRepository.java
│  │  │           │  └─ dto/
│  │  │           │     ├─ CategoryCreateRequest.java
│  │  │           │     └─ CategoryResponse.java
│  │  │           ├─ inquiry/
│  │  │           │  ├─ InquiryController.java
│  │  │           │  ├─ InquiryService.java
│  │  │           │  ├─ Inquiry.java
│  │  │           │  ├─ InquiryRepository.java
│  │  │           │  └─ dto/
│  │  │           │     ├─ InquiryCreateRequest.java
│  │  │           │     └─ InquiryResponse.java
│  │  │           ├─ mail/
│  │  │           │  ├─ MailService.java
│  │  │           │  └─ MailProperties.java
│  │  │           ├─ common/
│  │  │           │  ├─ error/
│  │  │           │  │  ├─ ErrorResponse.java
│  │  │           │  │  └─ GlobalExceptionHandler.java
│  │  │           │  └─ web/
│  │  │           │     └─ ApiResponse.java
│  │  │           └─ config/
│  │  │              ├─ SecurityConfig.java
│  │  │              ├─ CorsConfig.java
│  │  │              └─ JpaConfig.java
│  │  └─ resources/
│  │     ├─ application.yml
│  │     └─ application-local.yml
│  └─ test/
│     └─ java/
│        └─ com/
│           └─ finel/
│              └─ backend/
└─ README.md
```

## 도메인별 역할

각 도메인에는 해당 도메인 전용 명세서를 둔다.

```text
backend/docs/auth-spec.md
backend/docs/product-spec.md
backend/docs/category-spec.md
backend/docs/inquiry-spec.md
backend/docs/mail-spec.md
```

도메인 명세서에는 다음 내용을 적는다.

```text
담당 기능 범위
API 목록
요청/응답 DTO 초안
권한 규칙
주요 비즈니스 규칙
예외 처리 기준
기존 Next.js API와 맞춰야 할 응답 형태
```

도메인 명세서는 구현 전에 먼저 작성한다. 구현 중 API 형태나 규칙이 바뀌면 코드만 수정하지 말고 해당 도메인 명세서도 함께 갱신한다.

### auth

관리자 로그인과 인증 확인을 담당한다.

대상 API:

```text
POST /api/auth/login
GET  /api/auth/logout
GET  /api/auth/verify
```

포함 책임:

- 관리자 계정 조회
- 비밀번호 검증
- 인증 쿠키 또는 토큰 발급
- 관리자 인증 상태 확인

### product

제품 목록, 상세, 검색, 등록, 수정, 삭제를 담당한다.

대상 API:

```text
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PATCH  /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q=
```

포함 책임:

- 공개 제품 목록 조회
- 제품 상세 조회
- 제품 검색
- 관리자 제품 등록
- 관리자 제품 수정
- 관리자 제품 삭제
- 카테고리 정보 포함 응답 구성

### category

회사별 카테고리 조회, 생성, 삭제를 담당한다.

대상 API:

```text
GET    /api/categories?companyId=
POST   /api/categories
DELETE /api/categories?id=
```

포함 책임:

- `companyId` 기준 카테고리 조회
- 카테고리 생성
- `name + companyId` 중복 방지
- 제품이 연결된 카테고리 삭제 방지

### inquiry

고객 문의 등록과 관리자 문의 관리를 담당한다.

대상 API:

```text
GET    /api/inquiries
POST   /api/inquiries
DELETE /api/inquiries/{id}
```

포함 책임:

- 고객 문의 등록
- 문의 등록 후 메일 발송 요청
- 관리자 문의 목록 조회
- 관리자 문의 삭제

### mail

메일 발송을 담당한다.

포함 책임:

- 문의 등록 알림 메일 발송
- 메일 계정 설정 관리
- 메일 발송 실패 처리 정책 제공

메일은 독립 도메인이라기보다 다른 도메인에서 사용하는 기능성 모듈이다. 하지만 `inquiry` 안에 숨기지 않고 `mail`로 분리한다.

## common과 config 사용 기준

`common`은 여러 도메인에서 공유하는 코드만 둔다.

허용 예시:

```text
공통 에러 응답
전역 예외 처리
공통 응답 래퍼
공통 날짜 유틸
```

금지 예시:

```text
ProductService를 common으로 이동
Inquiry DTO를 common으로 이동
도메인별 비즈니스 규칙을 common에 배치
```

`config`는 Spring 설정 전용이다.

허용 예시:

```text
SecurityConfig
CorsConfig
JpaConfig
```

## DTO 작성 기준

DTO는 각 도메인 안에 둔다.

```text
product/dto/ProductResponse.java
inquiry/dto/InquiryCreateRequest.java
auth/dto/LoginRequest.java
```

공통 DTO 폴더를 최상위에 만들지 않는다. 응답 형태가 비슷해도 도메인이 다르면 DTO를 분리한다.

## Entity 작성 기준

초기 Entity는 현재 Prisma 모델을 최대한 그대로 옮긴다.

대상 모델:

```text
Admin
Category
Product
Inquiry
```

2단계에서는 Entity 파일을 빈 skeleton 수준으로 생성한다. 실제 필드 매핑과 관계 설정은 3단계에서 구현한다. 이후 구현 시 각 Entity는 해당 도메인 폴더 안에 둔다.

```text
auth/Admin.java
category/Category.java
product/Product.java
inquiry/Inquiry.java
```

2단계의 컴파일 가능한 최소 기준:

- Entity 파일은 JPA 매핑 없는 빈 `public class`로 둔다.
- `@Entity`, `@Id`, 관계 매핑, 컬럼 매핑은 3단계에서 추가한다.
- 2단계에서는 운영 DB 스키마와 매핑 검증을 하지 않는다.

예시:

```java
package com.finel.backend.product;

public class Product {
}
```

## Repository 작성 기준

Repository도 각 도메인 안에 둔다.

```text
auth/AdminRepository.java
product/ProductRepository.java
category/CategoryRepository.java
inquiry/InquiryRepository.java
```

Repository는 DB 접근만 담당한다. 응답 DTO 조립, 권한 판단, 메일 발송 같은 로직은 Repository에 넣지 않는다.

2단계의 컴파일 가능한 최소 기준:

- Repository 파일은 빈 `public interface`로 둔다.
- `JpaRepository<EmptyEntity, Long>` 또는 실제 Entity 타입 상속은 3단계에서 추가한다.
- 2단계에서 빈 Entity에 `JpaRepository`를 연결하면 `@Entity`, `@Id` 누락으로 컨텍스트 로딩이 깨질 수 있으므로 금지한다.

예시:

```java
package com.finel.backend.product;

public interface ProductRepository {
}
```

## Service 작성 기준

Service는 도메인 비즈니스 규칙을 담당한다.

예시:

```text
ProductService
- 제품 생성 전 카테고리 존재 여부 확인
- 제품 수정 시 기존 제품 존재 여부 확인

CategoryService
- 카테고리 중복 확인
- 제품이 연결된 카테고리 삭제 방지

InquiryService
- 문의 저장
- 저장 후 MailService 호출
```

다른 도메인을 호출해야 할 때는 Repository를 직접 가져오기보다 해당 도메인의 Service 또는 명확한 조회용 컴포넌트를 통해 접근한다.

## Controller 작성 기준

Controller는 HTTP 요청과 응답 매핑만 담당한다.

포함:

- URL 매핑
- Request DTO 검증
- Service 호출
- Response DTO 반환

제외:

- DB 직접 접근
- 비밀번호 검증
- 메일 발송 구현
- 복잡한 비즈니스 규칙

## API 경로 유지 원칙

Spring Boot로 옮긴 뒤에도 기존 Next.js API 경로를 최대한 유지한다.

이유:

- 프론트엔드 변경량을 줄일 수 있다.
- `docs/api-contract.md`와 비교하기 쉽다.
- API 이전 중에도 기능별 검증이 단순하다.

기본 prefix는 다음으로 둔다.

```text
/api
```

## 환경 변수 기준

Spring Boot에서는 다음 환경 변수를 사용한다.

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

`DB_URL`은 Spring JDBC URL 형식으로 둔다.

```text
DB_URL=jdbc:postgresql://localhost:5432/finel
```

기존 Next.js 환경 변수 이름과 반드시 같을 필요는 없다. 다만 README에 매핑표를 작성한다.

```text
DATABASE_URL      -> DB_URL
JWT_SECRET        -> JWT_SECRET
EMAIL_USER        -> MAIL_USERNAME
EMAIL_PASS        -> MAIL_PASSWORD
EMAIL_FROM        -> MAIL_FROM
EMAIL_TO          -> MAIL_TO
```

기존 `DATABASE_URL`이 `postgresql://user:password@host:port/db` 형식이라면 Spring에서 사용할 수 있도록 `jdbc:postgresql://host:port/db` 형식과 별도 username/password 값으로 변환한다.

2단계 필수/선택 기준:

- 필수: `FRONTEND_ORIGIN`
- 선택: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_TO`, `MAIL_HOST`, `MAIL_PORT`
- placeholder: `JWT_SECRET`

2단계는 인증 구현 전이므로 `JWT_SECRET`이 없어도 빌드와 로컬 실행이 성공해야 한다. 3단계 DB 모델 구현부터 DB 환경 변수를 필수로 전환하고, 관리자 인증 구현 단계에서 `JWT_SECRET`을 필수로 전환한다.

## application.yml 기준

초기 설정 파일은 다음처럼 분리한다.

```text
application.yml          # 공통 설정
application-local.yml    # 로컬 개발 설정
```

운영 설정은 파일에 직접 쓰지 않는다. 배포 환경 변수로 주입한다.

JPA는 기존 Prisma/PostgreSQL 스키마를 자동 변경하지 않도록 설정한다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

3단계에서 Entity 매핑이 완성된 뒤에는 `validate`로 변경할 수 있다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

`update`, `create`, `create-drop`은 기존 DB 스키마를 변경할 수 있으므로 사용하지 않는다.

2단계 로컬 실행 기준:

- `application-local.yml`은 DB 없이도 애플리케이션이 뜨도록 설정한다.
- 방법은 `DataSourceAutoConfiguration`과 JPA 자동 설정을 local profile에서 제외하거나, DB 설정을 lazy/mock 성격으로 분리하는 방식 중 하나를 선택한다.
- 이 선택은 2단계 전용이다. 3단계부터는 실제 PostgreSQL 연결과 JPA Entity 매핑 검증을 별도 명세에서 다룬다.

## 보안 기준

초기 뼈대에서는 Spring Security 설정 파일만 만든다.

상세 인증 구현은 관리자 API 이전 단계에서 확정한다.

2단계의 `SecurityConfig`는 애플리케이션 실행 확인을 위해 모든 요청을 `permitAll`로 연다. 실제 관리자 인증/인가 규칙은 인증 구현 단계에서 적용한다.

기본 방향:

- 공개 API: 제품 조회, 카테고리 조회, 문의 등록
- 관리자 API: 제품 생성/수정/삭제, 카테고리 생성/삭제, 문의 목록/삭제
- 인증 방식: 기존 httpOnly 쿠키 기반을 우선 검토
- CORS: `FRONTEND_ORIGIN`만 허용

쿠키 정책은 환경별로 분리한다.

```text
local:
  SameSite=Lax
  Secure=false
  Domain 미설정

production same-site:
  SameSite=Lax
  Secure=true
  Domain 필요 시에만 설정

production cross-site:
  SameSite=None
  Secure=true
  Domain 배포 구조에 맞춰 명시
```

프론트와 백엔드가 서로 다른 site로 배포되는 경우 `SameSite=Strict`는 관리자 인증 쿠키 전송을 막을 수 있으므로 사용하지 않는다.

## 테스트 구조

테스트도 도메인 단위로 둔다.

```text
src/test/java/com/finel/backend/
├─ auth/
├─ product/
├─ category/
└─ inquiry/
```

초기 뼈대 생성 직후에는 애플리케이션 컨텍스트 로딩 테스트만 있어도 된다.

2단계 테스트 기준:

- 테스트 profile은 DB 연결 없이 실행되어야 한다.
- Security 설정은 모든 요청 `permitAll` 상태에서 컨텍스트 로딩을 검증한다.
- Mail Sender는 실제 SMTP 연결을 시도하지 않아야 한다.
- JPA Repository는 빈 interface 상태이므로 repository bean 동작 테스트를 작성하지 않는다.

이후 기능 구현 단계에서 다음 테스트를 추가한다.

```text
product/ProductServiceTest.java
category/CategoryServiceTest.java
inquiry/InquiryServiceTest.java
auth/AuthServiceTest.java
```

## 프론트엔드 구조 변경 메모

이번 2단계의 직접 대상은 Spring Boot 백엔드다.

다만 이후 Next.js 프론트엔드도 정리한다면 `components`, `hooks`처럼 기술 계층별 폴더를 늘리는 방식보다 기능 단위 폴더를 우선한다.

예상 방향:

```text
src/
├─ domains/
│  ├─ auth/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ api.ts
│  │  └─ types.ts
│  ├─ product/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ api.ts
│  │  └─ types.ts
│  ├─ category/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ api.ts
│  │  └─ types.ts
│  └─ inquiry/
│     ├─ components/
│     ├─ hooks/
│     ├─ api.ts
│     └─ types.ts
├─ shared/
│  ├─ components/
│  ├─ lib/
│  └─ types/
└─ app/
```

프론트엔드에서도 공통 컴포넌트를 제외하면 도메인 내부에 컴포넌트와 훅을 둔다.

## 2단계에서 할 일

```text
1. backend/ Spring Boot 프로젝트 생성
2. Gradle 설정 및 Gradle Wrapper 포함
3. 기본 의존성 추가
4. com.finel.backend 패키지 생성
5. 도메인 단위 폴더와 빈 skeleton 클래스 생성
6. application.yml, application-local.yml 생성
7. backend/docs 도메인별 명세서 초안 생성
8. README에 실행 방법과 환경 변수 초안 작성
9. 애플리케이션 실행 확인
```

## 2단계에서 하지 않을 일

```text
API 구현
DB 마이그레이션
운영 DB 연결
Next.js API 제거
프론트엔드 fetch 경로 변경
관리자 인증 구현
메일 발송 구현
도메인 비즈니스 로직 구현
```

## 완료 기준

2단계 완료 기준은 다음과 같다.

```text
backend/ 프로젝트가 생성되어 있다.
Gradle Wrapper로 빌드와 실행이 가능하다.
Spring Boot 애플리케이션이 로컬에서 실행된다.
도메인 단위 패키지 구조가 잡혀 있다.
Controller, Service, Repository, Entity, DTO skeleton 파일이 생성되어 있다.
backend/docs/auth-spec.md, product-spec.md, category-spec.md, inquiry-spec.md, mail-spec.md 초안이 생성되어 있다.
2단계 Repository는 JpaRepository를 상속하지 않는 빈 interface다.
2단계 Entity는 JPA 어노테이션 없는 빈 class다.
local/test profile에서 DB, Mail, JWT_SECRET 없이 컨텍스트 로딩이 성공한다.
아직 실제 API 기능과 DB 접근 기능은 구현되어 있지 않다.
운영 DB에는 아무 변경도 발생하지 않는다.
```

## 이후 단계 연결

2단계가 끝나면 3단계에서 Prisma 모델을 기준으로 JPA Entity와 Repository를 작성한다.

3단계부터 실제 코드 구현이 시작된다.

진행 순서:

```text
2단계: Spring Boot 뼈대 생성
3단계: DB 모델 이전
4단계: 공개 API 이전
5단계: 관리자 API 이전
6단계: Next.js API 제거
7단계: 배포 정리
```
