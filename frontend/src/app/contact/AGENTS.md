# Contact Route 작업 가이드

- 제품 선택 목록과 문의 등록은 `lib/api` 및 `features/contact`를 사용한다.
- 필수값은 사용자에게 즉시 안내하되 서버 검증을 대체하지 않는다.
- 201은 정상 접수다. 502라도 `inquirySaved=true`이면 문의 저장은 완료된 상태이므로 재제출을 유도하지 않고 접수 완료 UX를 유지한다.
- 개인정보를 console, analytics, URL query에 남기지 않는다.
- 검증: validation, 201, 저장된 메일 실패(502), network error 흐름.
