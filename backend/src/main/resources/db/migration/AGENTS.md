# Flyway 변경 기록

- Prisma 스키마와 동일한 quoted PostgreSQL 테이블/제약을 생성하는 immutable V1 baseline을 추가했다.
- 기본 설정은 `ddl-auto=validate`, Flyway clean 금지, 상시 baseline-on-migrate 금지다.
- 기존 비어 있지 않은 DB의 일회성 baseline에만 `baseline` profile을 사용한다.
- 운영 baseline 실행은 이 코드 작업 범위에 포함하지 않으며 백업과 별도 승인이 필요하다.
- 검증: 빈 PostgreSQL Testcontainers migrate + JPA validate가 삭제 게이트다.
