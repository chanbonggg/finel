# Inquiry 도메인 구현 명세

작성일: 2026-05-30

## 목표

고객 문의 등록, 관리자 문의 목록 조회, 문의 삭제 기능을 Spring Boot로 이전한다.

이번 단계의 핵심은 기존 문의 등록 API의 alias 필드와 메일 발송 실패 처리 계약을 유지하면서, DB 저장 안정성을 확보하는 것이다.

## 범위

이번에 할 일:

```text
POST /api/inquiries
GET /api/inquiries
DELETE /api/inquiries/{id}
Inquiry Entity/Repository 사용
MailService 연동
문의 등록 alias 필드 처리
메일 실패 시 inquirySaved=true 응답 유지
```

이번에 하지 않을 일:

```text
문의 수정 API
문의 읽음 처리 API
스팸 방지 captcha
첨부파일 문의
메일 템플릿 에디터
```

## 현재 상태

기존 호출 위치:

```text
src/app/contact/page.tsx
src/hooks/useInquiry.ts
```

DB:

```text
"Inquiry"
- id integer PK
- name text not null
- phone text nullable
- email text not null
- content text not null
- company text nullable
- product text nullable
- isRead boolean not null default false
- createdAt timestamp not null
```

## 목표 상태

패키지 구조:

```text
backend/src/main/java/com/finel/backend/inquiry/
├─ InquiryController.java
├─ InquiryService.java
├─ Inquiry.java
├─ InquiryRepository.java
└─ dto/
   ├─ InquiryCreateRequest.java
   ├─ InquiryResponse.java
   └─ InquiryCreateResponse.java
```

의존:

```text
inquiry → mail.MailService 허용
mail → inquiry Repository 직접 참조 금지
```

## API 계약

### POST /api/inquiries

공개 문의 등록 API다.

인증:

```text
필요 없음
```

현재 프론트 Request:

```json
{
  "name": "홍길동",
  "email": "help@company.com",
  "phone": "010-1234-5678",
  "product": "제품명",
  "company": "회사명",
  "content": "문의 내용"
}
```

허용 alias:

```text
phoneNumber 또는 phone
message 또는 content
productName 또는 product
```

내부 매핑:

```text
phone = phoneNumber ?? phone
content = message ?? content
product = productName ?? product
email = email이 null 또는 blank이면 ""
company = company
```

필수 검증:

```text
name 필수
phoneNumber 또는 phone 필수
message 또는 content 필수
email은 필수 아님
```

성공:

```text
201 Created
```

```json
{
  "success": true,
  "stage": "DONE",
  "message": "문의가 성공적으로 접수되었습니다.",
  "mailSent": true,
  "inquiry": {
    "id": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "email": "help@company.com",
    "content": "문의 내용",
    "company": "회사명",
    "product": "제품명",
    "isRead": false,
    "createdAt": "2026-05-27T10:00:00.000Z"
  }
}
```

검증 실패:

```text
400 Bad Request
```

```json
{
  "success": false,
  "errorCode": "VALIDATION_FAILED",
  "stage": "VALIDATION",
  "message": "이름, 연락처, 문의 내용은 필수 입력 항목입니다."
}
```

DB 저장 실패:

```text
500 Internal Server Error
```

```json
{
  "success": false,
  "errorCode": "DB_WRITE_FAILED",
  "stage": "DB_WRITE",
  "message": "문의 저장에 실패했습니다.",
  "inquirySaved": false
}
```

메일 발송 실패:

```text
502 Bad Gateway
```

```json
{
  "success": false,
  "errorCode": "MAIL_SEND_FAILED",
  "stage": "MAIL_SEND",
  "inquirySaved": true,
  "inquiryId": 1,
  "message": "문의는 접수되었지만 메일 발송에 실패했습니다.",
  "mailError": {
    "message": "메일 오류 메시지",
    "code": "ERROR_CODE",
    "responseCode": 500,
    "command": "SMTP_COMMAND"
  }
}
```

주의:

```text
현재 프론트는 res.ok || data.inquirySaved이면 사용자에게 성공으로 안내한다.
메일 실패 시에도 inquirySaved=true를 반드시 유지한다.
```

### GET /api/inquiries

관리자 문의 목록 API다.

인증:

```text
관리자 필요
```

조회:

```text
createdAt desc
```

Success status:

```text
200 OK
```

Response:

```json
{
  "success": true,
  "inquiries": [
    {
      "id": 1,
      "name": "홍길동",
      "phone": "010-1234-5678",
      "email": "",
      "content": "문의 내용",
      "company": "회사명",
      "product": "제품명",
      "isRead": false,
      "createdAt": "2026-05-27T10:00:00.000Z"
    }
  ]
}
```

### DELETE /api/inquiries/{id}

관리자 문의 삭제 API다.

인증:

```text
관리자 필요
```

정책:

```text
id 존재 확인
존재하지 않으면 404
존재하면 삭제
```

성공:

```text
200 OK
```

```json
{
  "success": true,
  "message": "문의 내역이 삭제되었습니다."
}
```

## DTO 기준

```java
public record InquiryCreateRequest(
    String name,
    String phoneNumber,
    String phone,
    String email,
    String message,
    String content,
    String productName,
    String product,
    String company
) {}
```

```java
public record InquiryCreateResponse(
    boolean success,
    String errorCode,
    String stage,
    String message,
    Boolean inquirySaved,
    Integer inquiryId,
    Boolean mailSent,
    InquiryResponse inquiry,
    MailErrorResponse mailError
) {}
```

```java
public record MailErrorResponse(
    String message,
    String code,
    Integer responseCode,
    String command
) {}
```

```java
public record InquiryResponse(
    Integer id,
    String name,
    String phone,
    String email,
    String content,
    String company,
    String product,
    Boolean isRead,
    String createdAt
) {}
```

날짜 직렬화:

```text
createdAt은 Response DTO에서 ISO-8601 문자열로 변환한다.
목표 형식은 2026-05-27T10:00:00.000Z 이다.
Entity의 LocalDateTime을 그대로 JSON으로 반환하지 않는다.
```

## Service 기준

`InquiryService` 책임:

```text
alias 필드 정규화
필수값 검증
email null/blank → "" 보정
Inquiry 저장
MailService 호출
메일 실패 시 inquirySaved=true 응답 생성
문의 목록 조회
문의 삭제
InquiryResponse 변환
```

금지:

```text
메일 SMTP 상세 구현
Request DTO 없이 Entity에 직접 바인딩
기존 문의 데이터 일괄 삭제
```

## Repository 기준

필요 메서드:

```java
List<Inquiry> findAllByOrderByCreatedAtDesc();
```

저장 기본값:

```text
isRead=false
createdAt=@PrePersist
email은 DB not null이므로 null/blank면 ""
phone/company/product는 nullable 허용
```

## 예외 처리

```text
400: 필수값 누락
401: 관리자 인증 필요
404: 삭제 대상 없음
500: DB 저장 실패
502: 메일 발송 실패, 단 inquirySaved=true
```

로그 기준:

```text
DB 저장 실패는 exception class/message 기록
메일 실패는 inquiry id와 exception class/message 기록
고객 개인정보 전체를 INFO 로그에 남기지 않음
```

## 테스트 기준

Repository:

```text
findAllByOrderByCreatedAtDesc 정렬
save 시 isRead=false
save 시 createdAt 설정
email null/blank 저장 시 ""
delete는 테스트가 생성한 Inquiry만 대상
```

Service:

```text
phoneNumber/message/productName alias 처리
phone/content/product 기존 필드 처리
email optional 처리
필수값 누락 VALIDATION_FAILED
DB 저장 실패 DB_WRITE_FAILED
메일 실패 MAIL_SEND_FAILED + 502 + inquirySaved=true
메일 성공 DONE + 201 + mailSent=true + inquiry 객체 반환
```

Controller:

```text
POST /api/inquiries 공개 접근 가능
GET /api/inquiries 인증 없음 401
DELETE /api/inquiries/{id} 인증 없음 401
```

완료 기준:

```text
email 미입력 문의가 DB not null 제약에 걸리지 않는다.
메일 실패 시에도 프론트가 성공 안내할 수 있도록 inquirySaved=true가 내려간다.
문의 성공 응답은 mailSent와 inquiry 객체를 포함한다.
기존 alias request가 모두 허용된다.
관리자 문의 목록 응답 형태가 기존 프론트와 호환된다.
```
