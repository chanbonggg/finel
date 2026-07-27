# Flyway Migration 작업 가이드

## 원칙

- migration은 append-only다. 적용된 파일을 수정·삭제·이름 변경하지 않고 다음 버전의 새 SQL을 추가한다.
- 기본 JPA 정책은 `ddl-auto=validate`다. schema 변경은 명시적으로 승인된 migration 작업에서만 한다.
- quoted PostgreSQL 테이블/컬럼과 기존 제약의 대소문자·이름을 정확히 보존한다.

## 안전 규칙

- `flyway clean`, 운영 DB baseline, 데이터 삭제/대량 변환은 이 문서만으로 승인되지 않는다. 백업·대상 확인·명시적 사용자 승인이 필요하다.
- 비어 있지 않은 기존 DB의 baseline은 일회성 `baseline` profile로만 다루며 `baseline-on-migrate`를 상시 활성화하지 않는다.
- migration에 비밀값이나 운영 데이터를 넣지 않는다. destructive DDL은 forward-compatible 단계와 rollback/복구 계획을 문서화한다.

## 검증

빈 PostgreSQL에서 migrate 후 JPA validate와 관련 repository/service 테스트를 실행한다. 실제 기존 DB에는 적용하지 않는다.
- 검증: 빈 PostgreSQL Testcontainers migrate + JPA validate가 삭제 게이트다.
