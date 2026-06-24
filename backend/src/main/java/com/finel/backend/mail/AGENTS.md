# Mail 패키지 작업 지침

이 파일은 `com.finel.backend.mail`과 하위 패키지에 적용된다.

## 작업 전 확인할 문서

1. `docs/spring-migration-decisions.md`
2. `docs/env-cors-cookie-spec.md`의 MAIL 환경 변수
3. `docs/api-contract.md`의 문의 메일 실패 응답
4. `backend/docs/mail-spec.md`
5. `backend/docs/inquiry-spec.md`의 트랜잭션 경계

## 패키지 책임

- Mail은 외부 HTTP API를 제공하지 않는 기능성 모듈이다.
- `MailService`는 `InquiryMailRequest`를 받아 제목과 본문을 만들고 `JavaMailSender`로 관리자 알림을 전송한다.
- `MailProperties`는 `MAIL_*` 설정을 타입 안전하게 제공한다.
- 외부 메일 전송 실패는 `MailSendException`으로 변환해 호출자에게 전달한다.
- 문의 저장 성공 여부와 HTTP 응답 결정은 inquiry 패키지 책임이다.

## 고정 계약

- public method 계약은 `void sendInquiryNotification(InquiryMailRequest request)`를 기준으로 한다.
- 제목은 `[FINEL 문의] {고객명} - {제품명 또는 일반 문의}` 형식을 유지한다.
- 본문에는 문의 ID, 이름, 연락처, 이메일, 회사, 제품, 문의 내용, 접수 시각을 포함한다.
- null/blank 표시는 `-`로 통일한다.
- 동기 발송, 비동기 큐, 재시도 워커는 현재 명세 범위가 아니다.

## 의존성과 트랜잭션 규칙

- MailService에서 `InquiryRepository`나 다른 DB Repository를 직접 참조하지 않는다.
- MailService에 `@Transactional`을 붙이지 않는다.
- 저장 transaction 안에서 SMTP를 호출하지 않는다.
- MailService가 문의 Entity를 다시 조회하거나 저장 상태를 판정하지 않는다.
- `MailSendException`은 inquiry의 저장 commit 이후 처리되어야 하며 저장 rollback을 유발하면 안 된다.

## 설정과 보안

- 사용하는 변수는 `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_TO`, `MAIL_HOST`, `MAIL_PORT`다.
- host/port 외 운영 필수값을 코드에 하드코딩하거나 저장소에 넣지 않는다.
- password, SMTP 인증 정보, 문의 content 전문을 로그에 남기지 않는다.
- SMTP 내부 message/code/command를 API 응답으로 전달하지 않는다.
- 로컬 기본 테스트는 메일 설정이나 실제 네트워크 연결에 의존하지 않는다.

## 구현 패턴

- Spring의 `JavaMailSender`를 주입하고 직접 SMTP client를 새로 만들지 않는다.
- 예외는 원인을 보존해 `MailSendException`으로 감싸되 사용자 노출 메시지와 분리한다.
- 템플릿 생성 로직은 단위 테스트할 수 있게 작게 분리한다.
- 메일 DTO는 필요한 값만 포함하고 Inquiry Entity를 노출하지 않는다.

## 테스트와 검증

- 제목, 모든 본문 필드, null/blank의 `-` 치환을 검증한다.
- JavaMailSender 예외가 `MailSendException`으로 변환되는지 검증한다.
- Inquiry 연동에서는 성공 201과 실패 502/`inquirySaved=true`를 검증한다.
- DB 저장 실패 시 MailService가 호출되지 않음을 검증한다.
- 실제 SMTP 발송은 기본 Gradle test에서 금지하고 mock 또는 별도 수동 integration profile만 사용한다.
- Windows에서는 `backend`에서 `.\gradlew.bat test`를 실행한다.

## 이번 구현 변경

- 환경 변수 기반 발신/수신 설정과 `JavaMailSender` 알림 발송을 구현했다.
- SMTP 예외는 공개 상세를 노출하지 않는 `MailSendException`으로 변환한다.
- 검증: 실제 SMTP 접근 없이 mock 기반 테스트 대상이다.
