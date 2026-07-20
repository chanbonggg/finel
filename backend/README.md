# Finel Spring Boot Backend

Next.js 프론트엔드가 호출하는 Spring Boot REST API다.

## 기술 기준

```text
Java 21 LTS
Spring Boot 3.5.15
Gradle Wrapper 8.14.5
PostgreSQL
```

## 기본 검증

```powershell
.\gradlew.bat test
.\gradlew.bat bootRun --args="--spring.profiles.active=devdb"
```

일반 로컬 실행은 `devdb` profile을 사용하며, 루트 `.env`의 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`가 필요하다. `local` profile은 과거 skeleton 단계의 DB 없는 실행용으로 남아 있으므로, 현재 기능 검증에는 사용하지 않는다.

기존 사용 DB를 연결할 때는 `.env`에 `SPRING_FLYWAY_ENABLED=false`를 둔다. 이 설정은 Flyway를 실행하지 않고 JPA 매핑 검증만 수행한다. Flyway baseline은 데이터베이스 이력을 변경하는 별도 운영 작업이다.

## 환경 변수

```text
FRONTEND_ORIGIN
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
AUTH_COOKIE_SECURE
AUTH_COOKIE_DOMAIN
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
MAIL_TO
MAIL_HOST
MAIL_PORT
```

비밀값과 운영 DB 접속 정보는 저장소에 커밋하지 않는다.

로컬에서 관리자 계정이 없는 빈 개발 DB를 사용할 때만 `ADMIN_BOOTSTRAP_ENABLED=true`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`를 설정한다. 계정이 이미 있으면 bootstrap은 비활성화한다.

로컬에서는 `AUTH_COOKIE_SECURE=false`, `AUTH_COOKIE_DOMAIN` 미설정을 사용한다. 프론트가 `www.finel.co.kr`, API가 `api.finel.co.kr`이고 Next `/chanyoung` proxy가 인증을 확인하는 운영 구조에서는 `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_DOMAIN=finel.co.kr`가 필요하다.
