# Spring API 전환 기록

- 관리자 제품/카테고리/문의 훅을 공통 Spring API client로 전환했다.
- 관리자 목록은 `includeHidden=true`, 변경 요청은 CSRF 포함 helper를 사용한다.
- 숨김 제품 수정은 공개 상세 API가 아니라 이미 받은 관리자 목록 데이터를 사용한다.
- 검증: 관리자 CRUD E2E, lint/build 대상이다.
