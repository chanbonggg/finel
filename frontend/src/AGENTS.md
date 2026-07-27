# Frontend 소스 작업 가이드

## 디렉터리 책임

- `app/`: route, layout, metadata, route handler. 페이지 고유 조합만 둔다.
- `features/`: 제품·문의·관리자 등 도메인 UI, 상태, 훅.
- `components/`: 여러 도메인에서 재사용하는 표시 컴포넌트.
- `lib/api/`: Spring API base URL, credentials, CSRF, DTO 변환의 단일 진입점.
- `proxy.ts`: `/chanyoung` UI 접근 시 Spring `/api/auth/verify` 상태를 확인하는 fail-closed guard.

## 경계 규칙

- `proxy.ts`는 JWT를 해석하지 않으며 server API URL 누락·timeout·network/non-200은 로그인으로 보낸다. Spring Security가 실제 API 보안 경계다.
- Next API route, Prisma, DB client, localStorage 인증을 새로 도입하지 않는다. DB와 migration은 Spring이 소유한다.
- API base URL이 없는 서버 렌더링은 API client의 안전 fallback을 사용하고, 브라우저의 상대 `/api` fallback은 제거 전 호환 목적 외로 확장하지 않는다.

## 검증

변경한 흐름의 SSR/metadata 또는 관리자 인증 경계를 확인하고 `npm run lint`, `npm run build`를 실행한다.
