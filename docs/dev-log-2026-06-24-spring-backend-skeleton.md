# [Backend] Spring Boot 백엔드 기본 설정 및 skeleton 구성 (완료)

a/
## 목표

- 기존 Next.js 프로젝트 안에 독립 실행 가능한 Spring Boot 백엔드 skeleton을 구성한다.
- 운영 DB, Mail, JWT secret 없이 local/test profile이 실행되도록 만든다.

## 완료 항목

- ✅ Java 21, Spring Boot 3.5.15, Gradle Wrapper 8.14.5 프로젝트 연결
- ✅ `FinelBackendApplication` 시작 클래스 구성
- ✅ `application.yml`, `application-local.yml`, `application-test.yml` 분리
- ✅ local/test profile에서 DataSource와 Hibernate 자동 설정 임시 제외
- ✅ 기본 SecurityFilterChain 전체 permit 설정
- ✅ CORS origin, credentials, method, CSRF header 기본 설정
- ✅ Auth/Product/Category/Inquiry/Mail/PublicMeta 도메인 skeleton 생성
- ✅ Common error/web 및 config skeleton 생성
- ✅ Repository는 JPA 상속 없는 빈 interface로 유지
- ✅ Entity는 JPA annotation 없는 빈 class로 유지
- ✅ `gradlew.bat test` 성공
- ✅ local profile로 Tomcat 8080 기동 성공
- ✅ 임시 Spring Security 비밀번호 자동 생성 제거
- ✅ IntelliJ/임시 Initializr 폴더 Git 제외

## 이슈/메모

- local/test의 DataSource 자동 설정 제외는 skeleton 단계 전용이다.
- 실제 JPA Entity 구현 단계에서 제외 설정을 제거하고 복제 개발 DB로 `ddl-auto=validate`를 수행해야 한다.
- 기존 Next.js API Route와 Prisma는 아직 유지한다.
- 운영 DB와 운영 SMTP에는 연결하지 않았다.

## 다음 단계

- Prisma 모델을 기준으로 Admin, Category, Product, Inquiry JPA Entity 구현
- Repository 구현 및 복제 개발 DB schema validate
- Repository 테스트 작성
- 공개 API 8개 구현 시작

