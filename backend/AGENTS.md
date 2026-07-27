# Backend 작업 가이드

## 범위와 구조

이 문서는 `backend/` 전체에 적용된다. 기능은 `src/main/java/com/finel/backend/<domain>`에서 소유하며, HTTP controller → service → repository/entity 및 `dto` 흐름을 따른다. 더 가까운 기능별 `AGENTS.md`가 구체 계약을 보완한다.

## 핵심 규칙

- 공개·관리자 API 계약은 `docs/api-contract.md`를 따른다. Entity를 요청/응답으로 직접 노출하지 않는다.
- 도메인 간 읽기 의존성은 해당 도메인의 최소 `Reader` 인터페이스를 사용한다. 다른 도메인의 Repository를 직접 주입하거나 순환 의존성을 만들지 않는다.
- 인증·CORS·CSRF·rate limit 같은 전역 경계는 `config/`에서만 다룬다. 각 controller에서 보안을 우회하지 않는다.
- JPA 기존 quoted 테이블/컬럼 매핑과 `ddl-auto=validate`를 보존한다. 스키마 변경은 승인된 Flyway 작업에서만 한다.
- controller는 HTTP/검증 경계, service는 정책·트랜잭션·DTO 변환, repository는 영속성 쿼리를 담당한다.

## 실행과 검증

```powershell
./gradlew.bat test
./gradlew.bat bootRun --args="--spring.profiles.active=devdb"
```

실제 PostgreSQL, SMTP, Cloudinary를 사용하는 검증은 별도 요청과 안전한 환경 설정이 있을 때만 수행한다.

