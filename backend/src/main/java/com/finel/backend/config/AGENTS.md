# Config 패키지 작업 가이드

## 책임

`config`은 Security, CORS, JPA, profile별 skeleton repository, 공개 요청 rate limit을 소유한다. 개별 도메인의 HTTP 정책이나 DB 쿼리를 넣지 않는다.

## 고정 보안 규칙

- 인증은 `auth_token` HttpOnly HS256 JWT cookie다. `JWT_SECRET`은 UTF-8 32바이트 이상이며 토큰/secret을 로그에 남기지 않는다.
- CSRF는 로그인과 관리자 mutation에서 활성화한다. 현재 예외는 공개 `POST /api/inquiries`와 OPTIONS뿐이다.
- CORS의 credential 허용 시 wildcard origin을 사용하지 않는다. cookie의 Secure/domain/SameSite 설정은 auth 패키지 계약과 일치시킨다.
- 잘못된 cookie가 공개 API를 인증 실패로 바꾸지 않게 경로별 optional authentication 규칙을 검토한다. 관리자/`includeHidden`은 엄격히 보호한다.
- rate limit은 신뢰 프록시가 설정되기 전 `remoteAddr`만 사용한다. 로그인 5회/분, 문의 3회/10분 기본값과 bounded cleanup을 임의 변경하지 않는다.

## Profile 및 검증

- `local`은 DB 없는 skeleton 기동 전용이다. 운영/devdb의 JPA validate·JWT fail-fast·Flyway 정책을 약화하지 않는다.
- Security 통합 테스트로 401, CSRF 403, CORS credential, rate-limit 경계를 확인한다.
