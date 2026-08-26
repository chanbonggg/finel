# Finel 작업 가이드

## 적용 범위와 우선순위

- 이 문서는 저장소 전체에 적용된다. 하위 디렉터리의 `AGENTS.md`가 같은 주제에서는 이 문서보다 우선한다.
- 현재 구조는 `frontend/`(Next.js App Router)와 `backend/`(Spring Boot REST API)가 PostgreSQL을 공유하는 분리형 애플리케이션이다.
- API의 단일 기준은 `docs/api-contract.md`다. API, DTO, 인증, 오류 형식을 바꾸면 소비 코드와 해당 계약 문서를 한 작업으로 갱신한다.

## 공통 작업 원칙

- 변경 전에는 가장 가까운 `AGENTS.md`, 관련 구현, API 계약을 함께 확인한다.
- 기능 코드는 소유 도메인에 둔다. 프론트는 `features/<domain>`, 백엔드는 `com.finel.backend.<domain>`을 우선한다.
- 비밀값, JWT, 쿠키 값, DB 연결 정보, SMTP 내용, 고객 개인정보를 코드·문서·로그에 남기지 않는다.
- 명시 요청 없이 DB 데이터/스키마를 변경하거나 Flyway migration을 실행하지 않는다. 기존 DB는 `ddl-auto=validate` 전제를 유지한다.
- 기존 작업트리 변경은 사용자 소유로 간주하며 요청 범위 밖 파일을 되돌리거나 정리하지 않는다.

## 변경 완료 기준

- 프론트 API 변경: `frontend`에서 `npm run lint`와 `npm run build`.
- 백엔드 변경: `backend`에서 `./gradlew test` (Windows: `./gradlew.bat test`).
- 양쪽 계약에 영향이 있으면 관련 공개·관리자 흐름과 401/403/404/409 등 오류 경계를 확인한다.

