# Finel 프로젝트 구조 문서

작성일: 2026-07-20

## 프로젝트 개요

`finel`은 산업용 공압 부품 기업 웹사이트다. Next.js 프론트엔드와 Spring Boot REST API가 분리되어 있으며 PostgreSQL을 공유한다.

- Frontend: Next.js 16.1.1, React 19, TypeScript, Tailwind CSS (`frontend/`)
- Backend: Java 21, Spring Boot 3.5, Spring Security, JPA, Flyway (`backend/`)
- Database: PostgreSQL
- 배포 전제: Next.js 프론트와 Spring API의 same-site HTTPS 구성

## 핵심 명령어

```powershell
# frontend/
npm run dev
npm run lint
npm run build

# backend/
.\gradlew.bat bootRun --args="--spring.profiles.active=devdb"
.\gradlew.bat test
```

DB 스키마나 데이터를 변경하는 명령은 명시 요청 없이 실행하지 않는다. `.env`의 비밀값은 출력하거나 문서화하지 않는다.

## 실행 환경 분리

```text
root/.env                 Spring: DB, JWT, mail, Cloudinary
frontend/.env.local       Next: API URL, site URL, revalidation secret
```

로컬 기본값은 Next.js `http://localhost:3000`, Spring `http://localhost:8080`이다. `devdb` profile은 개발 DB를 사용한다. `local` profile은 이전 skeleton 단계의 DB 없는 실행용이므로 기능 검증에 사용하지 않는다.

기존 사용 DB를 연결하는 동안에는 root `.env`의 `SPRING_FLYWAY_ENABLED=false`를 유지한다. 이 값은 `.env` properties import를 통해 `spring.flyway.enabled`에 연결되며, Flyway migration 없이 JPA 매핑만 검증한다. baseline은 별도 승인된 DB 작업이다.

## 라우팅과 API

- 공개 페이지: `/`, `/products`, `/products/[id]`, `/contact`, `/about`
- 관리자: `/chanyoung`, `/chanyoung/login`
- Spring API: `/api/auth`, `/api/products`, `/api/categories`, `/api/inquiries`, `/api/uploads`, `/api/sitemap-data`
- Next `proxy.ts`는 관리자 페이지 접근 시 Spring `/api/auth/verify`를 호출한다.

## 인증과 외부 서비스

- Spring은 `auth_token` httpOnly JWT 쿠키와 CSRF 토큰으로 관리자 변경 요청을 보호한다.
- 로컬은 `AUTH_COOKIE_SECURE=false`, `AUTH_COOKIE_DOMAIN` 미설정이다.
- 운영 HTTPS는 `AUTH_COOKIE_SECURE=true`다. `www.finel.co.kr`과 `api.finel.co.kr` 분리 시 `AUTH_COOKIE_DOMAIN=finel.co.kr`가 필요하다.
- Cloudinary 업로드는 Spring의 `CLOUDINARY_*` 설정을 사용하며, API secret은 `NEXT_PUBLIC_*`로 노출하지 않는다.
- 문의는 DB 저장 후 SMTP 메일을 발송한다.

## 유지보수 기준

- Prisma, `DATABASE_URL`, `EMAIL_USER`, `EMAIL_PASS`, Next API Route, `/admin`은 이전 구현의 용어이며 새 코드·문서에 사용하지 않는다.
- API 계약을 변경하면 `docs/api-contract.md`와 프론트 API 클라이언트를 함께 갱신한다.
- 캐시 갱신은 Spring `NEXT_REVALIDATE_URL`과 Next `REVALIDATE_SECRET`이 같은 비밀값으로 설정된 경우에만 활성화한다.
