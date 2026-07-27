# Contact Feature 작업 가이드

`features/contact`은 문의 form 상태, 제출, 사용자 피드백을 소유한다.

- request shape와 오류 판별은 `lib/api/inquiries` 타입을 사용한다.
- 제출 중 상태를 표시하고 성공 뒤 중복 제출을 막는다. 저장 성공·메일 실패(`inquirySaved=true`)는 성공 접수로 처리한다.
- 이름, 연락처, 이메일, 문의 내용은 브라우저 로그나 분석 이벤트에 기록하지 않는다.
