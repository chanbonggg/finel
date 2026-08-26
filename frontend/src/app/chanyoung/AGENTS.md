# Admin Route 작업 가이드

- `/chanyoung/login`은 CSRF 발급 뒤 Spring login을 호출한다. token을 localStorage/sessionStorage에 저장하거나 JWT를 해석하지 않는다.
- 관리자 UI는 `features/admin`의 hooks/components를 조합하고 API 호출은 `lib/api`를 사용한다.
- 401은 로그인 화면으로 이동, `CSRF_INVALID` 403은 안전하게 재시도를 안내한다. proxy는 UX guard이며 API 권한 검증을 대체하지 않는다.
- 검증: login, refresh 유지, 제품·카테고리·문의 CRUD, logout 후 401.
