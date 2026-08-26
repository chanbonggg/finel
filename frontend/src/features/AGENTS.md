# Frontend Feature 작업 가이드

각 기능은 UI·도메인 훅·로컬 상태를 함께 소유한다. 공용 API 호출은 `@/lib/api`, 공용 타입은 해당 API 타입 또는 feature 공개 타입을 사용한다.

- 기능 간 구현 파일을 직접 참조하지 않는다. 공통화가 필요하면 `components`, `hooks`, 또는 `lib`로 의도를 명확히 옮긴다.
- API 오류는 status/errorCode를 보존해 사용자에게 적절히 표시하고, 관리자 401은 로그인으로 이동한다.
- mutation 뒤에는 로컬 상태와 서버 상태를 일관되게 갱신하며, 중복 제출·업로드 중 상태를 고려한다.
- UI 변경은 loading, empty, error, keyboard/accessibility 상태까지 검토한다.
