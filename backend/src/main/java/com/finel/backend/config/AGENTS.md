# 변경 기록

- cookie 기반 HS256 JWT Resource Server, BCrypt, CORS, CSRF JSON 오류 처리를 구성했다.
- `POST /api/inquiries`만 CSRF 예외이며 로그인과 관리자 변경 요청은 CSRF 검증 대상이다.
- JWT secret은 UTF-8 기준 최소 32바이트를 시작 시 검증한다.
- IP 기준 로그인 5회/분, 문의 3회/10분 인메모리 rate limit을 적용했다.
- 공개 경로에서는 잘못된 `auth_token`을 익명으로 취급하고, `includeHidden` 및 보호 API에서는 엄격히 401 처리한다.
- rate limit은 신뢰 프록시 설정 전까지 `remoteAddr`만 사용하며 만료 정리와 10,000개 상한을 둔다.
- CSRF 403과 일반 권한 거부 403의 오류 응답을 구분한다.
- 검증: Spring 컴파일과 인증/CSRF 통합 테스트가 필요하다.
- `local` skeleton profile은 DataSource/JPA/Flyway를 제외하고 읽기 빈값을 반환하는 repository proxy를 제공해 DB 없이 context와 HTTP 서버가 기동한다.
- local 전용 비운영 JWT placeholder로 Security bean을 완결하며 운영 profile의 secret fail-fast와 `ddl-auto=validate`는 유지한다.
- tester: 문의 3회/10분과 로그인 5회/분 rate limit 경계 테스트, Security 통합 테스트를 추가했다.
