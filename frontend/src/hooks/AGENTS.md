# Shared Hooks 작업 가이드

`hooks/`에는 여러 feature에서 재사용 가능한 클라이언트 훅만 둔다. 도메인 API 상태와 관리자 CRUD는 각 feature가 소유한다.

- browser API, timer, listener는 mount/unmount 정리를 보장한다.
- 반환값과 dependency는 안정적으로 유지하고 stale closure, 중복 요청, SSR 실행을 피한다.
- API 호출이 필요하면 `@/lib/api`를 사용하며 직접 endpoint·cookie·CSRF 처리를 구현하지 않는다.
