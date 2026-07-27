# Common 패키지 작업 가이드

## 책임

- `common/error`: 공통 오류 DTO, 도메인 예외, 예외→HTTP JSON 변환.
- `common/web`: request id, UTC 날짜 직렬화, 공통 API 응답 유틸리티.
- `common/cache`: 제품·카테고리 변경 뒤 Next cache invalidation event/notifier.

## 규칙

- 오류 형식과 errorCode는 `docs/api-contract.md`를 지키며, controller마다 별도 오류 응답을 만들지 않는다.
- Entity `LocalDateTime`은 API로 직접 직렬화하지 말고 UTC ISO-8601 `Z` 형식으로 변환한다.
- 공통 모듈은 특정 도메인의 service/repository를 참조하지 않는다. 도메인 정책은 각 도메인에 둔다.
- request id, exception class 이외의 개인정보·secret·token을 오류 로그에 넣지 않는다.
- cache invalidation은 성공한 변경 뒤에만 발행하고, notifier 실패가 핵심 DB 변경을 rollback하지 않게 한다.
