# Spring API 전환 기록

- 제품 선택 목록과 공개 문의 등록을 Spring API client로 전환했다.
- 문의 메일 실패 시에도 `inquirySaved=true`를 성공 접수로 처리하는 기존 UX를 유지한다.
- 검증: 문의 201/502 저장 성공 흐름과 lint/build 대상이다.
