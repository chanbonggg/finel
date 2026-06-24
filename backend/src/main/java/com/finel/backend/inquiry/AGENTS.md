# Inquiry 패키지 작업 지침

이 파일은 `com.finel.backend.inquiry`와 하위 `dto` 패키지에 적용된다.

## 작업 전 확인할 문서

1. `docs/spring-migration-decisions.md`
2. `docs/migration-runbook.md`
3. `docs/api-contract.md`의 문의 API
4. `backend/docs/inquiry-spec.md`
5. `backend/docs/mail-spec.md`
6. `docs/e2e-verification-spec.md`의 문의/메일 실패 플로우

## 패키지 책임

- `InquiryController`: 공개 등록, 관리자 목록, 관리자 삭제의 HTTP 계약을 담당한다.
- `InquiryService`: alias 정규화, 검증, 저장과 메일 발송 orchestration, 목록·삭제, DTO 변환을 담당한다.
- `InquiryPersistenceService`: 문의 저장의 별도 Spring bean이며 commit이 끝나는 트랜잭션 경계를 제공한다.
- `InquiryRepository`: Inquiry 영속성만 담당한다.
- DTO는 `inquiry/dto`에 두고 Entity를 request/response에 직접 사용하지 않는다.

## 공개 등록 계약

- `POST /api/inquiries`는 인증과 CSRF 없이 공개 접근 가능하다.
- `phoneNumber ?? phone`, `message ?? content`, `productName ?? product` alias를 모두 지원한다.
- name, 연락처, 문의 내용은 필수이고 trim 후 blank를 거부한다. email은 선택이며 null/blank를 `""`로 저장한다.
- 성공은 201, `stage=DONE`, `mailSent=true`, 저장된 inquiry DTO를 반환한다.
- 검증 실패는 400, `VALIDATION_FAILED`, `stage=VALIDATION`이다.
- DB 저장 실패는 500, `DB_WRITE_FAILED`, `stage=DB_WRITE`, `inquirySaved=false`다.
- 메일 실패는 502, `MAIL_SEND_FAILED`, `stage=MAIL_SEND`, `inquirySaved=true`, `inquiryId`를 반환한다.
- SMTP exception message, response code, command를 공개 응답에 포함하지 않는다.
- 공개 문의 rate limit 기본값은 IP 기준 3회/10분이다. 임의의 forwarded header를 신뢰하지 않는다.

## 관리자 계약

- `GET /api/inquiries`는 관리자 인증이 필요하며 `createdAt desc`로 반환한다.
- `DELETE /api/inquiries/{id}`는 관리자 인증과 CSRF가 필요하고 없는 id는 404다.
- 현재 명세에 읽음 처리나 수정 API는 없다. `isRead` 기능을 임의로 추가하지 않는다.
- 응답 날짜는 UTC `...Z` ISO-8601 문자열이며 Entity의 `LocalDateTime`을 직접 직렬화하지 않는다.

## 트랜잭션 경계

- 순서는 검증 → `InquiryPersistenceService.save()` commit → `MailService` 호출이다.
- `InquiryPersistenceService.save()`만 저장 트랜잭션을 가진 별도 bean이어야 한다.
- `InquiryService.createInquiry()` 전체를 `@Transactional`로 감싸지 않는다.
- 같은 클래스의 self-invocation으로 트랜잭션 분리를 시도하지 않는다.
- SMTP 호출 동안 DB transaction을 열어 두지 않는다.
- `MailSendException`이 이미 commit된 문의를 rollback하게 하지 않는다.
- DB 저장 실패 시 MailService를 호출하지 않는다.

## 의존성과 개인정보

- inquiry는 `mail.MailService`를 사용할 수 있다.
- mail이 InquiryRepository를 역참조하게 만들지 않는다.
- 고객 이름, 전화, email, 문의 전문을 INFO 로그에 남기지 않는다.
- 실패 로그에는 필요한 경우 inquiry id와 exception class/message만 남기고 공개 응답과 분리한다.

## JPA와 구현 패턴

- 기존 quoted `"Inquiry"`, `"isRead"`, `"createdAt"` 매핑을 유지한다.
- protected 기본 생성자와 `Inquiry.create(...)`, `@PrePersist` 기본값 패턴을 재사용한다.
- `isRead=false`, email not-null 호환 기본값을 유지한다.
- 운영 데이터나 기존 문의를 테스트 또는 구현 과정에서 삭제하지 않는다.

## 테스트와 검증

- 모든 alias 조합, blank 필수값, optional email을 검증한다.
- DB 실패 시 MailService 미호출과 `inquirySaved=false`를 검증한다.
- 메일 실패 시 502 응답 후 별도 조회 트랜잭션에서 문의가 남아 있음을 검증한다.
- SMTP 상세가 응답에 노출되지 않는지 검증한다.
- 관리자 목록·삭제의 401/403/404와 정렬을 검증한다.
- JavaMailSender는 mock하고 기본 테스트에서 실제 SMTP를 호출하지 않는다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`를 실행한다.

## 이번 구현 변경

- legacy/current 입력 필드를 정규화하고 필수값을 검증한다.
- 별도 `REQUIRES_NEW` persistence service에서 저장·commit한 뒤 메일을 발송한다.
- 메일 실패는 502, `inquirySaved=true`, `inquiryId`를 유지하며 목록·삭제 관리자 API를 구현했다.
- 검증: Spring 컴파일 및 tester의 저장 후 메일 실패/rollback 분리 테스트 대상이다.
- tester: 저장 후 메일 실패 시 `inquirySaved=true`/`inquiryId` 유지와 검증 실패 시 저장·메일 미호출 테스트를 추가했다.
