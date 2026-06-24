# DB Migration Ownership Spec

작성일: 2026-06-23

## 목표

Prisma 제거 후 PostgreSQL 스키마 변경의 단일 소유자를 Flyway로 전환한다. JPA Entity와 `ddl-auto`가 스키마 생성 도구가 되어서는 안 된다.

## 확정 결정

```text
전환 중 스키마 검증: Hibernate ddl-auto=validate
전환 후 스키마 변경: Flyway
Prisma migrate/db push: 제거 완료 후 사용 금지
운영 자동 DDL: 금지
```

## 도입 시점

JPA Entity가 복제 개발 DB에서 validate를 통과한 뒤, Prisma package와 `prisma/` 폴더를 제거하기 전에 도입한다. 3단계 Entity 매핑 중에는 Flyway를 실행하지 않는다.

## baseline 절차

1. 기존 PostgreSQL 스키마를 read-only로 조사한다.
2. 새 빈 DB를 만들 수 있는 `V1__baseline_schema.sql`을 작성한다.
3. 빈 PostgreSQL Testcontainers에서 V1 적용과 JPA validate를 검증한다.
4. 기존 비어 있지 않은 개발 DB에는 일회성 baseline을 version 1로 기록하고 V1을 재실행하지 않는다.
5. 운영 baseline은 백업과 dry-run 검증 후 별도 승인된 배포 작업으로 한 번만 실행한다.
6. 이후 모든 변경은 `V2__...sql`부터 순차 적용한다.

`baselineOnMigrate=true`를 애플리케이션 상시 설정으로 두지 않는다. 기존 DB baseline 전용 profile 또는 운영자가 실행하는 일회성 명령에서만 사용하고 완료 후 비활성화한다.

## 보호 규칙

```text
운영 DB에서 clean 금지
flyway.cleanDisabled=true
운영 baseline 전 백업 필수
운영에서 repair는 원인 분석과 승인 없이 금지
적용된 migration 파일 수정 금지
DDL과 Entity 변경은 같은 변경 단위에서 검증
```

## 테스트

```text
빈 Testcontainers PostgreSQL에 V1부터 migrate 성공
Hibernate validate 성공
기존 개발 DB baseline 후 pending migration 없음
V2 예제 migration의 migrate/validate 성공
flyway clean 호출 실패 확인
```

## 완료 기준

```text
새 빈 DB를 Flyway만으로 생성할 수 있다.
기존 DB는 데이터/스키마 변경 없이 baseline 이력을 가질 수 있다.
JPA validate가 통과한다.
Prisma 제거 후 schema 변경 절차가 문서화되어 있다.
운영 baseline rollback이 DB backup/restore 절차로 정의되어 있다.
```

