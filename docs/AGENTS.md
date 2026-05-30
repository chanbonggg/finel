# Finel 프로젝트 구조 문서

작성일: 2026-05-28

## 1. 프로젝트 개요

`finel`은 산업용 공압 부품 기업 파인엘의 제품 소개, 제품 검색, 문의 접수, 관리자 제품/문의 관리를 담당하는 Next.js 애플리케이션이다.

- 프레임워크: Next.js 16.1.1 App Router
- UI: React 19.2.3, Tailwind CSS 4
- 언어: TypeScript 5.9.3
- ORM: Prisma 5.22.0
- 데이터베이스: PostgreSQL, `DATABASE_URL` 기반
- 배포 전제: Vercel
- 패키지 매니저: npm

## 2. 핵심 명령어

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
```

주의:

- `npm run build`는 `prisma generate && next build`를 실행한다.
- `db:push`, `migrate:dev`, `migrate:deploy`는 DB 스키마를 변경할 수 있으므로 명시 요청 없이 실행하지 않는다.
- `.env` 내용, `DATABASE_URL`, JWT/메일/Cloudinary 비밀값은 출력하거나 문서화하지 않는다.

## 3. 최상위 디렉터리

```text
.
├─ prisma/
│  └─ schema.prisma
├─ public/
│  ├─ partners/
│  ├─ og-image.png
│  └─ naverc15fb588e0e8a42c9f400f47b22e28a6.html
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ constants/
│  ├─ hooks/
│  ├─ lib/
│  ├─ types/
│  └─ proxy.ts
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## 4. 라우팅 구조

```text
src/app/
├─ page.tsx                  # 메인 페이지
├─ layout.tsx                # 전역 레이아웃, SEO, Navbar, QuickMenu, Footer
├─ loading.tsx
├─ robots.ts
├─ sitemap.ts
├─ about/page.tsx
├─ contact/page.tsx
├─ privacy/page.tsx
├─ products/page.tsx
├─ products/[id]/page.tsx
├─ products/category/[id]/
├─ admin/page.tsx            # 관리자 대시보드
├─ admin/login/page.tsx      # 관리자 로그인
└─ api/
   ├─ auth/login/route.ts
   ├─ auth/logout/
   ├─ auth/verify/
   ├─ categories/route.ts
   ├─ products/route.ts
   ├─ products/[id]/route.ts
   ├─ products/search/route.ts
   ├─ inquiries/route.ts
   └─ inquiries/[id]/route.ts
```

## 5. 데이터 모델

Prisma 모델은 `Admin`, `Category`, `Product`, `Inquiry` 네 가지다.

### Admin

관리자 로그인 계정이다.

- `username`: unique
- `password`: bcrypt 해시 저장 전제
- `createdAt`: 생성 시각

### Category

제품 카테고리다. 회사 구분값인 `companyId`와 함께 사용된다.

- `name`
- `companyId`
- `products`: `Product[]`
- `@@unique([name, companyId])`: 같은 회사 안에서 카테고리명 중복 방지

### Product

제품 정보다.

- `name`
- `categoryId`, `category`
- `spec`
- `description`
- `imageUrl`
- `isVisible`
- `createdAt`, `updatedAt`

### Inquiry

고객 문의 정보다.

- `name`
- `phone`
- `email`
- `content`
- `company`
- `product`
- `isRead`
- `createdAt`

## 6. API 흐름

### 인증

- `POST /api/auth/login`

  - `username`, `password` 검증
  - `bcryptjs`로 비밀번호 비교
  - `jose` `SignJWT`로 12시간 만료 토큰 발급
  - `auth_token` httpOnly 쿠키 저장
- `src/lib/admin-auth.ts`

  - `requireAdmin()`이 `auth_token` 쿠키와 `JWT_SECRET`을 검증한다.
  - 실패 시 JSON 401 또는 500 응답을 반환한다.
- `src/proxy.ts`

  - `/admin`은 로그인 페이지를 제외하고 보호한다.
  - `/api/inquiries`는 고객 문의 등록 `POST /api/inquiries`만 공개한다.
  - `/api/products`, `/api/categories`는 `GET`만 공개하고 변경 메서드는 관리자 인증을 요구한다.

### 제품

- `GET /api/products`: 전체 제품 최신순 조회, 카테고리명과 `companyId`를 평탄화해서 반환한다.
- `POST /api/products`: 제품 등록, 관리자 인증 필요.
- `GET /api/products/[id]`: 단일 제품 상세 조회.
- `PATCH /api/products/[id]`: 제품 수정, Zod 검증 사용.
- `DELETE /api/products/[id]`: 제품 삭제.
- `GET /api/products/search?q=`: 공개 제품 이름 검색, 최대 10개 반환.

### 카테고리

- `GET /api/categories?companyId=`: 회사별 카테고리 조회.
- `POST /api/categories`: 카테고리 생성, Zod 검증 사용.
- `DELETE /api/categories?id=`: 카테고리 삭제. 연결된 제품이 있으면 삭제하지 않는다.

### 문의

- `GET /api/inquiries`: 관리자 문의 목록 조회.
- `POST /api/inquiries`: 고객 문의 등록.
  - DB에 먼저 저장한다.
  - 이후 Gmail SMTP 설정으로 메일을 발송한다.
  - 메일 발송 실패 시 `inquirySaved: true`, `inquiryId`를 포함한 502 응답을 반환한다.
- `DELETE /api/inquiries/[id]`: 관리자 문의 삭제.

## 7. 클라이언트 구조

### 공통 컴포넌트

- `Navbar.tsx`: 전역 내비게이션.
- `Footer.tsx`: 전역 푸터.
- `QuickMenu.tsx`: 빠른 메뉴.
- `PhoneButton.tsx`: 전화 버튼.
- `ProductSearch.tsx`: 디바운스된 제품 검색 UI.

### 관리자 화면

- `src/app/admin/page.tsx`

  - 클라이언트 컴포넌트.
  - 문의 내역과 제품 관리 탭을 전환한다.
  - 로그아웃 후 `/admin/login`으로 이동한다.
- `src/app/admin/components/ProductForm.tsx`

  - 제품 등록/수정 폼.
  - Cloudinary 이미지 업로드 흐름과 연결된다.
- `src/app/admin/components/ProductTable.tsx`

  - 제품 목록 표시 및 수정/삭제 액션.
- `src/app/admin/components/CategoryManager.tsx`

  - 카테고리 추가/삭제 관리.
- `src/app/admin/components/InquiryList.tsx`, `InquiryItem.tsx`

  - 문의 목록과 개별 문의 항목 렌더링.

### 훅

- `useProductAdmin`

  - 제품, 카테고리, 이미지 업로드, 제품 등록/수정/삭제, 카테고리 추가/삭제 상태를 한 곳에서 관리한다.
  - Cloudinary 공개 환경 변수 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`가 필요하다.
- `useInquiry`

  - 관리자 문의 목록 조회와 삭제를 담당한다.
- `useDebounce`

  - 검색 입력 디바운싱에 사용된다.

## 8. 설정 파일

### `next.config.ts`

- React Compiler 활성화.
- `next/image` 원격 이미지 호스트로 `res.cloudinary.com` 허용.

### `tsconfig.json`

- `strict: true`
- `moduleResolution: bundler`
- 경로 별칭: `@/*` -> `./src/*`
- `allowJs: true`, `skipLibCheck: true`

### SEO/메타데이터

- `src/constants/seo.ts`: 사이트명, 회사 설명, 기본 키워드.
- `src/lib/site-url.ts`: `NEXT_PUBLIC_SITE_URL`, Vercel URL 환경 변수, 기본값 `https://www.finel.co.kr` 순서로 사이트 URL 결정.
- `src/app/layout.tsx`: Open Graph, canonical, Google/Naver verification, Organization JSON-LD 설정.

## 9. 외부 서비스와 환경 변수

필요한 환경 변수 이름만 기록한다. 값은 기록하지 않는다.

- `DATABASE_URL`: Prisma PostgreSQL 연결 문자열.
- `JWT_SECRET`: 관리자 JWT 서명/검증.
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP 문의 알림 발송.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary 업로드용 공개 클라우드명.
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Cloudinary unsigned upload preset.
- `NEXT_PUBLIC_SITE_URL`: 명시적 사이트 URL.
- `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`: Vercel 배포 URL fallback.
- `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`: 검색 콘솔 인증.

## 10. 주요 데이터 흐름

### 고객 제품 탐색

```text
사용자 페이지
→ ProductSearch 또는 제품 목록
→ /api/products, /api/products/search, /api/products/[id]
→ Prisma Product + Category 조회
→ 제품 카드/상세 페이지 렌더링
```

### 고객 문의 등록

```text
contact/page.tsx
→ POST /api/inquiries
→ Inquiry DB 저장
→ nodemailer Gmail 발송
→ 성공 또는 메일 실패 상태 반환
```

### 관리자 제품 관리

```text
/admin/login
→ POST /api/auth/login
→ auth_token httpOnly 쿠키 저장
→ /admin 접근
→ proxy.ts 인증 확인
→ useProductAdmin
→ /api/products, /api/categories 변경 API 호출
```

### 관리자 문의 관리

```text
/admin
→ useInquiry
→ GET /api/inquiries
→ 문의 목록 표시
→ DELETE /api/inquiries/[id]
```

## 11. 개발 시 주의사항

- DB 스키마 변경 명령은 명시 요청 없이 실행하지 않는다.
- `.env`와 비밀값을 출력하지 않는다.
- 관리자 인증이 필요한 API는 `proxy.ts` 보호 정책과 맞춰 변경한다.
- `Product` 응답은 일부 API에서 `category` 객체를 카테고리명 문자열로 평탄화한다. 프론트 타입과 API 응답 모양을 함께 확인해야 한다.
- `src/app/api/products/[id]/route.ts`에는 `any` 기반 업데이트 객체가 있다. 타입 개선 시 Zod 스키마와 Prisma 업데이트 타입을 함께 맞춰야 한다.
- `prisma.ts`는 개발 환경에서 전역 PrismaClient를 재사용한다. 쿼리 로그가 켜져 있어 로컬 디버깅에는 유용하지만 로그 노이즈가 있을 수 있다.
- 문의 등록은 DB 저장 후 메일 발송 순서다. 메일 실패는 문의 저장 실패와 다르게 처리해야 한다.
- Cloudinary 업로드는 클라이언트 훅에서 직접 호출한다. preset 권한과 이미지 공개 정책을 배포 환경에서 확인해야 한다.

## 12. 향후 문서 관리 위치

프로젝트 구조와 운영 메모는 `docs/` 아래에서 관리한다.

- `docs/agent.md`: 현재 프로젝트 구조와 에이전트 작업 기준.
- 새 기능 설계, 장애 기록, 배포 체크리스트도 `docs/` 아래에 추가한다.
