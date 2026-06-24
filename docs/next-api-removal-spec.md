# Next.js API Route Removal Spec

작성일: 2026-06-23

## 목표

Spring Boot API 전환이 끝난 뒤 Next.js의 서버 API 구현을 안전하게 제거한다. 삭제 자체보다 Spring API가 모든 호출을 대체했고 rollback이 가능한지 확인하는 것을 우선한다.

## 삭제 대상

```text
src/app/api/
src/lib/admin-auth.ts
src/lib/prisma.ts
Next.js API 보호 용도로 사용하던 src/proxy.ts 로직
```

`src/proxy.ts`는 파일을 바로 삭제하지 않는다. `/admin` 페이지 보호를 Spring `GET /api/auth/verify` 호출 방식으로 바꾼 뒤 불필요한 API matcher와 JWT 직접 검증만 제거한다.

## 시작 조건

다음 조건을 모두 만족해야 한다.

```text
Spring Product/Category/Inquiry/Auth/Mail API 구현 완료
GET /api/auth/csrf와 관리자 CSRF 요청 검증 완료
공개/관리자 Next.js 호출이 Spring API로 전환됨
서버 컴포넌트, metadata, sitemap의 Prisma 직접 사용 제거 완료
관리자 bootstrap 절차 검증 완료
주요 E2E 통과
삭제 직전 rollback commit 또는 tag 존재
```

## 호출 전환 확인

```powershell
rg "fetch\('/api|fetch\(`/api" src
rg "@/lib/prisma|@prisma/client|prisma\." src
rg "@/lib/admin-auth|jwtVerify|SignJWT" src
```

통과 기준:

```text
Spring API용 공통 client 외 상대 경로 fetch가 없다.
Next.js 화면과 서버 컴포넌트에서 Prisma import가 없다.
Next.js가 JWT_SECRET으로 토큰을 직접 검증하지 않는다.
Cloudinary 외부 API 호출은 예외로 유지한다.
```

## 삭제 순서

1. `src/proxy.ts`를 Spring verify 기반 `/admin` guard로 전환한다.
2. `src/lib/admin-auth.ts`와 Next API용 JWT 직접 검증을 제거한다.
3. `src/app/api`를 제거한다.
4. Next.js build와 E2E를 실행한다.
5. `src/lib/prisma.ts`, Prisma package/scripts, `prisma/`는 `docs/next-prisma-removal-spec.md` 조건에 따라 별도로 제거한다.

API Route와 Prisma 제거를 한 커밋에 섞지 않는다. API Route 제거가 실패하면 Prisma 제거 없이 해당 커밋만 되돌릴 수 있어야 한다.

## proxy 전환 기준

```text
/admin/login은 공개
/admin과 /admin/**은 Spring verify 200일 때만 허용
verify 401/403/5xx/timeout/network error는 /admin/login redirect
원 요청 Cookie 헤더만 Spring으로 전달
Next.js에서 JWT payload를 신뢰하거나 해석하지 않음
```

Spring 관리자 API의 401/403이 최종 보안 경계다. UI guard 성공 여부와 무관하게 Spring API는 독립적으로 인증과 CSRF를 검증해야 한다.

## 삭제 후 검증

```powershell
Test-Path src/app/api
rg "src/app/api|@/lib/admin-auth|@/lib/prisma|@prisma/client" src
npm run lint
npm run build
```

브라우저 검증:

```text
공개 제품 목록/상세/검색
문의 등록
관리자 로그인과 CSRF token 발급
새로고침 후 인증 유지
관리자 제품/카테고리/문의 변경
로그아웃 후 관리자 API 401
```

## rollback

- API Route 삭제 커밋을 되돌린다.
- `NEXT_PUBLIC_API_BASE_URL`과 `SERVER_API_BASE_URL`을 이전 값으로 복구한다.
- Spring에서 발급한 쿠키와 기존 Next.js 쿠키 호환을 가정하지 않고 관리자를 재로그인시킨다.
- rollback 확인 전 Prisma 파일과 package 의존성은 제거하지 않는다.

## 완료 기준

```text
src/app/api가 존재하지 않는다.
Next.js build와 lint가 성공한다.
브라우저 Network에서 데이터 API가 Spring origin 또는 승인된 same-origin proxy로 호출된다.
/admin guard가 Spring verify만 사용한다.
Next.js 런타임에 JWT_SECRET이 필요 없다.
E2E 주요 플로우가 통과한다.
```

