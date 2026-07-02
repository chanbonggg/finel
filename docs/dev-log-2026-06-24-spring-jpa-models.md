# [Backend] Spring JPA 모델 및 Repository 구현 (완료)

## 목표
- 기존 Prisma의 Admin, Category, Product, Inquiry 모델을 Spring Data JPA로 매핑한다.
- 운영 DB를 변경하지 않고 복제 개발 DB에서 검증할 수 있는 실행 설정을 준비한다.

## 완료 항목
- ✅ Admin, Category, Product, Inquiry Entity 구현
- ✅ Prisma의 대소문자 구분 테이블명과 camelCase 컬럼명 명시
- ✅ Category-Product 연관관계와 nullable/default/time 필드 매핑
- ✅ 도메인별 JpaRepository와 제품 조회용 EntityGraph/JPQL 구현
- ✅ `devdb` 프로필에 PostgreSQL 연결 및 `ddl-auto=validate` 설정
- ✅ 엔티티 생성·기본값·수정 콜백 단위 테스트 5개 추가
- ✅ Spring 컨텍스트 테스트를 포함한 Gradle 테스트 6개 통과
- ✅ 로컬 `finel_dev` PostgreSQL 18에서 Hibernate schema validate 통과
- ✅ Prisma의 대소문자 테이블명을 보존하는 physical naming strategy 적용

## 미완료 항목
- ⏳ 실제 PostgreSQL 기반 Repository 통합 테스트

## 이슈/메모
- 로컬 PostgreSQL 18에 테스트 전용 `finel_dev` DB와 Prisma 호환 스키마를 구성했다.
- 루트 `.env`의 DATABASE_URL은 원격 Neon DB이므로 안전한 개발 DB임이 확인되기 전에는 검증에 사용하지 않는다.
- 스키마 보호를 위해 Hibernate `update`, `create`, `create-drop`은 사용하지 않는다.
- Spring Boot 기본 naming strategy에서는 `"Admin"`이 `admin`으로 변환되므로 `PhysicalNamingStrategyStandardImpl`이 필요하다.

## 다음 단계
- Repository 통합 테스트를 추가하고 조회·저장·rollback 동작 검증
