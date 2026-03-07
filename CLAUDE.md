# Finel 프로젝트

산업용 공압 부품 전문 기업 웹사이트. 제품 소개 + 고객 문의 + 관리자 대시보드.

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **DB**: PostgreSQL (Neon) + Prisma ORM 5
- **인증**: JWT (jose) + bcryptjs + httpOnly 쿠키
- **이미지**: Cloudinary (클라이언트 직접 업로드)
- **메일**: Nodemailer (Gmail)
- **패키지 매니저**: npm

## 주요 명령어

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드 (prisma generate 포함)
npm run db:push          # 스키마 → DB 반영 (프로덕션 영향 주의!)
npm run migrate:dev      # 마이그레이션 생성 (개발)
npm run prisma:studio    # DB GUI 관리
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (routes)/        # 페이지
│   │   ├── page.tsx     # 메인 (force-dynamic)
│   │   ├── products/    # 제품 목록/상세
│   │   ├── contact/     # 문의 페이지
│   │   ├── about/       # 회사 소개
│   │   └── admin/       # 관리자 대시보드 (JWT 보호)
│   └── api/
│       ├── auth/        # login, verify, logout
│       ├── products/    # CRUD
│       ├── categories/  # CRUD
│       └── inquiries/   # 문의 등록/조회/삭제
├── components/          # Navbar, Footer, QuickMenu 등
├── lib/
│   ├── prisma.ts        # Prisma 클라이언트 싱글톤
│   ├── admin-auth.ts    # JWT 검증 (서버 전용)
│   └── api/             # API 클라이언트 함수
└── hooks/               # useInquiry, useProductAdmin
```

## DB 스키마 요약

```
Admin       - 관리자 계정 (username, password)
Category    - 카테고리 (name, companyId) ← companyId로 회사 구분
Product     - 제품 (name, spec, description, imageUrl, isVisible, categoryId)
Inquiry     - 고객 문의 (name, email, phone, company, product, content, isRead)
```

## 인증 흐름

1. `/api/auth/login` → JWT 발급 → httpOnly 쿠키 저장 (12시간)
2. `middleware.ts` → 쿠키 검증 → `/admin/*` 보호
3. `admin-auth.ts` → 서버 컴포넌트/API에서 토큰 검증

## 주의사항

- **DB 공유**: Vercel Preview와 Production이 같은 DB 사용 중 → `db:push` 신중하게
- **환경변수**: `.env`에 DB URL, 이메일 비밀번호 등 민감 정보 → 절대 커밋 금지
- **이미지**: Cloudinary URL만 DB 저장, 파일은 Cloudinary에 보관
- **카테고리**: `companyId` 필드로 다중 회사 지원 구조

## API 패턴

```typescript
// 공개 API - 인증 불필요
GET  /api/products
GET  /api/categories?companyId=1
POST /api/inquiries

// 관리자 API - JWT 쿠키 필요
POST   /api/products
PATCH  /api/products/[id]
DELETE /api/products/[id]
GET    /api/inquiries
```

## 코딩 컨벤션

- Server Components 기본, 'use client' 최소화
- API 응답: `{ success, data, error }` 형식
- 에러 메시지: 보안상 구체적 원인 노출 금지 (로그인 실패 등)
- 환경변수: `process.env.XXX` 직접 사용 (서버), `NEXT_PUBLIC_` 접두사 (클라이언트)

## Claude Code 에이전트/스킬 사용 원칙

**무조건 먼저 확인하기:**
1. 사용자 요청을 받으면 즉시 ~/.claude/ 폴더의 **agents/**, **skills/** 디렉토리 확인
2. 관련 에이전트나 스킬이 존재하면 **명시적 요청 없이 자동으로 사용**
3. 직접 코드를 작성하거나 수정하지 말 것

**자동 사용 사례:**
- "코드 리뷰해봐" → `code-review` 스킬 자동 호출
- "테스트 작성해" → `tdd` 스킬 자동 호출
- 새 기능 요청 → `planner` 에이전트 자동 호출
- 빌드 오류 → `build-error-resolver` 에이전트 자동 호출
- 보안 검토 필요 → `security-review` 스킬 자동 호출

**원칙:**
- 에이전트/스킬 사용이 더 나은 경우 → **자동으로 사용** (사용자 명시 불필요)
- 에이전트/스킬이 있는데 직접 작성 → **금지** (조직 워크플로우 위반)
- 스킬/에이전트가 없으면 직접 작성 가능
