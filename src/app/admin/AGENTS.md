# Spring 인증 전환 기록

- 로그인은 CSRF 발급 후 Spring login을 호출하고 logout도 Spring API로 전환했다.
- 제품/카테고리/문의 관리자 동작은 hooks의 credentials/CSRF client를 사용한다.
- 검증: 로그인, 새로고침 유지, CRUD, logout 후 401 E2E 대상이다.
