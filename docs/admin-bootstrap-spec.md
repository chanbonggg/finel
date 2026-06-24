# Admin Bootstrap Spec

작성일: 2026-05-31

## 목표

Prisma 제거 후에도 관리자 계정을 안전하게 생성하거나 초기화할 수 있는 절차를 정의한다.

`prisma/seed.js` 제거 전에는 반드시 Spring 또는 SQL 기반 관리자 bootstrap 절차가 준비되어 있어야 한다.

## 범위

이번에 할 일:

```text
관리자 계정 생성 방식 확정
초기 관리자 계정 존재 여부 확인 절차 정의
운영 DB 보호 기준 정의
Prisma seed.js 제거 조건 정의
```

이번에 하지 않을 일:

```text
관리자 회원가입 공개 API
비밀번호 변경 UI
다중 관리자 권한 체계
OAuth 도입
```

## 결정

관리자 계정 bootstrap은 공개 HTTP API로 만들지 않는다.

확정 방식:

```text
기본: Spring ApplicationRunner 기반 bootstrap
fallback: 운영자가 직접 실행하는 SQL seed
```

배포 환경의 일회성 job도 같은 `ApplicationRunner`와 환경 변수를 호출하는 방식으로만 구성한다.

금지:

```text
POST /api/admin/create 같은 공개/반공개 생성 API
평문 비밀번호 저장
운영 로그에 초기 비밀번호 출력
기존 admin 계정 무조건 덮어쓰기
```

## Spring Bootstrap 방식

환경 변수:

```text
ADMIN_BOOTSTRAP_ENABLED
ADMIN_USERNAME
ADMIN_PASSWORD
```

정책:

```text
ADMIN_BOOTSTRAP_ENABLED=true일 때만 동작한다.
Admin 테이블에 ADMIN_USERNAME이 이미 있으면 아무 작업도 하지 않는다.
ADMIN_PASSWORD는 BCrypt로 hash 후 저장한다.
Admin.create(username, passwordHash)로 Entity를 생성한다.
Admin @PrePersist가 UTC createdAt을 설정한다.
생성 성공 후 password 원문은 로그에 남기지 않는다.
운영에서는 최초 1회 실행 후 ADMIN_BOOTSTRAP_ENABLED=false로 되돌린다.
```

로그 허용:

```text
admin bootstrap skipped: existing username
admin bootstrap created: username
```

로그 금지:

```text
ADMIN_PASSWORD 원문
bcrypt hash 전체
DB_URL
```

## SQL Seed 방식

운영자가 직접 SQL을 사용할 경우:

```text
비밀번호는 애플리케이션 외부에서 BCrypt hash로 만든다.
INSERT 전에 username 중복을 확인한다.
운영 DB에서 DELETE/UPDATE 없이 INSERT만 수행한다.
```

예시 형식:

```sql
insert into "Admin" ("username", "password", "createdAt")
select 'admin', '<bcrypt-hash>', timezone('utc', now())
where not exists (
  select 1 from "Admin" where "username" = 'admin'
);
```

주의:

```text
위 SQL의 username/hash는 예시다.
실제 hash는 문서나 git에 커밋하지 않는다.
```

## Prisma seed.js 제거 조건

`prisma/seed.js`는 다음 조건을 모두 만족한 뒤 제거한다.

```text
Admin Entity와 AdminRepository가 운영 DB에서 validate 통과
Spring Auth 로그인 검증 통과
Spring bootstrap 또는 SQL seed 절차가 문서화됨
개발/운영 환경에서 관리자 계정 생성 절차를 1회 검증
package.json에서 prisma seed 의존성이 제거 가능
```

## 테스트 기준

Spring bootstrap 테스트:

```text
ADMIN_BOOTSTRAP_ENABLED=false이면 생성하지 않음
ADMIN_BOOTSTRAP_ENABLED=true이고 계정 없으면 생성
이미 계정 있으면 중복 생성하지 않음
password는 BCrypt hash로 저장
createdAt이 UTC 기준으로 자동 설정됨
평문 password가 로그에 남지 않음
```

수동 검증:

```text
bootstrap 후 POST /api/auth/login 성공
잘못된 비밀번호는 401
createdAt 값 존재
```

## 운영 안전 기준

```text
운영 DB 스키마 변경 없음
기존 관리자 계정 삭제 금지
기존 관리자 password 자동 변경 금지
bootstrap 변수는 작업 후 제거 또는 비활성화
ADMIN_PASSWORD는 Secret 환경 변수로만 관리
```

## 완료 기준

```text
Prisma 없이 관리자 계정 생성 경로가 있다.
관리자 로그인 E2E가 통과한다.
seed 절차가 운영 DB를 덮어쓰지 않는다.
prisma/seed.js 제거 여부를 판단할 수 있다.
```
