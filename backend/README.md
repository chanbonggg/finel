# Finel Spring Boot Backend

Next.js API Route와 Prisma 서버 기능을 단계적으로 이전하는 Spring Boot 백엔드다.

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
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
```

`local`과 `test` profile은 skeleton 단계에서 DB 없이 실행된다. JPA Entity 구현 단계부터 이 임시 자동 설정 제외를 제거하고 복제 개발 DB의 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를 사용한다.

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

로컬에서는 `AUTH_COOKIE_SECURE=false`, `AUTH_COOKIE_DOMAIN` 미설정을 사용한다. 프론트가 `www.finel.co.kr`, API가 `api.finel.co.kr`이고 Next `/admin` proxy가 인증을 확인하는 운영 구조에서는 `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_DOMAIN=finel.co.kr`가 필요하다.
