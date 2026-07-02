# [Backend] Spring Boot 전환 명세 확정 및 보완 (완료)

## 목표

- Next.js API Route와 Prisma 서버 기능을 Spring Boot로 이전하기 전에 선택지로 남아 있던 기술·보안·운영 기준을 확정한다.
- 기존 계획 문서의 누락, 충돌, 컴파일 오류 가능성을 제거해 구현을 시작할 수 있는 상태로 만든다.

## 완료 항목

- ✅ Java 21 LTS, Spring Boot 3.5.15, Gradle Wrapper 8.14.5 확정
- ✅ HS256 쿠키 JWT와 Spring Security OAuth2 Resource Server 기준 확정
- ✅ CSRF token 발급 및 `X-XSRF-TOKEN` 검증 정책 추가
- ✅ 운영 배포를 same-site custom domain 또는 same-origin proxy로 확정
- ✅ 문의 저장 transaction과 SMTP 발송 경계 분리
- ✅ SMTP 내부 오류의 공개 응답 노출 제거
- ✅ Admin 생성/UTC `createdAt` 처리와 Product Repository 누락 보완
- ✅ Flyway baseline 및 DB migration 소유권 명세 추가
- ✅ 누락된 Next.js API Route 제거 명세 추가
- ✅ E2E에 CSRF, lint, mail rollback, rate limit 검증 추가
- ✅ 문서 참조 경로, 코드 fence, UTF-8 문자, 공백 오류 검사 통과

## 이슈/메모

- 현재 Next.js `npm run build`는 성공하지만 `npm run lint`에는 기존 오류가 남아 있다. 전환 완료 게이트는 lint error 0으로 확정했다.
- Spring 소스는 아직 생성하지 않았다. 다음 작업은 `backend/` 뼈대 생성과 DB 없는 context 실행 검증이다.
- Prisma와 `src/app/api`는 Spring API와 프론트 전환 검증이 끝날 때까지 유지한다.

## 다음 단계

- `backend/`에 확정 버전으로 Spring Boot skeleton 생성
- Gradle Wrapper build/test와 DB 없는 local context 실행 확인
- 복제 개발 DB에서 JPA Entity/Repository `ddl-auto=validate` 검증
- 공개 API 8개부터 구현
