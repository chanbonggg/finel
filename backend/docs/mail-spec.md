# Mail 도메인 구현 명세

작성일: 2026-05-30

## 목표

문의 등록 후 관리자에게 알림 메일을 발송하는 기능을 Spring Boot로 이전한다.

Mail 도메인은 독립 API를 제공하지 않고, Inquiry 도메인에서 사용하는 기능성 모듈로 동작한다.

## 범위

이번에 할 일:

```text
MailService 구현
MailProperties 구현
문의 등록 알림 메일 발송
메일 발송 실패를 InquiryService가 처리할 수 있게 예외 전달
환경 변수 기반 SMTP 설정
```

이번에 하지 않을 일:

```text
메일 발송 API 공개
메일 템플릿 관리 UI
첨부파일 발송
대량 메일 발송
메일 큐/재시도 워커
```

다음 단계로 넘길 일:

```text
비동기 발송
재시도 큐
메일 템플릿 HTML 분리
운영 모니터링/알림
```

## 현재 상태

기존 문의 등록 API에서 DB 저장 후 메일을 발송한다.

중요 계약:

```text
메일 발송 실패는 문의 저장 실패가 아니다.
메일 실패 시에도 inquirySaved=true를 반환한다.
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/mail/
├─ MailService.java
├─ MailProperties.java
└─ MailSendException.java
```

의존:

```text
inquiry.InquiryService → mail.MailService
mail → inquiry.Repository 직접 참조 금지
```

## 환경 변수

```text
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
MAIL_TO
MAIL_HOST
MAIL_PORT
```

기본값 정책:

```text
MAIL_HOST, MAIL_PORT는 application.yml에 기본값을 둘 수 있다.
MAIL_USERNAME, MAIL_PASSWORD, MAIL_TO는 운영에서 필수다.
로컬에서 메일 설정이 없으면 메일 발송 테스트는 mock으로 대체한다.
```

예시:

```yaml
spring:
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

## Service 계약

`MailService` public method:

```java
void sendInquiryNotification(InquiryMailRequest request);
```

`InquiryMailRequest`:

```java
public record InquiryMailRequest(
    Integer inquiryId,
    String name,
    String phone,
    String email,
    String company,
    String product,
    String content,
    String createdAt
) {}
```

동작:

```text
메일 제목 생성
문의 내용을 plain text 또는 간단한 HTML로 구성
JavaMailSender로 발송
실패 시 MailSendException throw
```

금지:

```text
MailService가 InquiryRepository를 조회하지 않는다.
MailService가 문의 저장 성공/실패 응답을 결정하지 않는다.
SMTP password를 로그로 남기지 않는다.
```

## 메일 내용 기준

제목:

```text
[FINEL 문의] {고객명} - {제품명 또는 일반 문의}
```

본문 포함 항목:

```text
문의 ID
이름
연락처
이메일
회사
제품
문의 내용
접수 시각
```

null/blank 표시:

```text
값이 없으면 "-"로 표시한다.
```

## 예외 처리

Mail 도메인 내부 예외:

```text
MailSendException
```

InquiryService 처리:

```text
InquiryPersistenceService의 저장 transaction commit 후 MailService 호출
MailSendException 발생 시 이미 commit된 문의 저장은 유지
응답은 502 Bad Gateway + MAIL_SEND_FAILED
inquirySaved=true
SMTP 내부 상세는 공개 응답에서 제외
```

로그 기준:

```text
메일 실패 시 inquiryId, exception class, message 기록
MAIL_PASSWORD, SMTP 인증 정보 기록 금지
문의 content 전문은 debug에서도 기록하지 않음
```

트랜잭션 금지:

```text
MailService에 @Transactional 지정
DB transaction을 유지한 채 SMTP 호출
MailSendException으로 저장 transaction rollback
```

## 테스트 기준

단위 테스트:

```text
메일 제목 생성
본문 필드 매핑
null/blank 값 "-" 표시
JavaMailSender 예외 발생 시 MailSendException 변환
```

Inquiry 연동 테스트:

```text
MailService 성공 시 201 + DONE + mailSent=true + inquiry 객체 반환
MailService 실패 시 502 + MAIL_SEND_FAILED + inquirySaved=true
MailService 실패 응답에 SMTP exception 상세 없음
MailService 실패 후 DB 재조회 시 문의 존재
DB 저장 실패 시 MailService 호출하지 않음
```

로컬 테스트:

```text
실제 SMTP 연결을 기본 테스트에서 시도하지 않는다.
JavaMailSender는 mock 처리한다.
실제 메일 발송 확인은 수동 테스트 또는 별도 integration profile에서만 실행한다.
```

완료 기준:

```text
문의 저장과 메일 발송 실패 처리가 분리된다.
메일 실패가 DB rollback을 유발하지 않는다.
MAIL_* 민감정보가 저장소와 로그에 남지 않는다.
InquiryService가 메일 실패를 api-contract.md 형식으로 변환할 수 있다.
```
