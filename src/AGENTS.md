# Next.js Spring 전환 기록

- `proxy.ts`는 JWT를 직접 해석하지 않고 Spring `/api/auth/verify`의 status만 사용한다.
- 서버 API base URL 누락, timeout, network error, non-200은 fail-closed로 로그인 화면에 redirect한다.
- proxy는 `/admin` UI guard만 담당하며 API 보안 경계는 Spring Security다.
- 검증: admin guard 200/401/network failure, lint/build 대상이다.
- 기존 `src/app/api`, Prisma client/schema/seed, Next 전용 인증 helper는 Spring 전환 게이트 통과 후 제거했다.
- Next.js 빌드는 Prisma generate 없이 `next build`만 실행하며 DB 접근과 schema migration은 Spring JPA/Flyway가 소유한다.
