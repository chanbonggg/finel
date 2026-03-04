# Code Review: finel (전체 코드베이스)

Reviewed: 2026-03-04
Scope: `src/app/api/**`, `src/lib/**`, `src/hooks/**`
Reviewer: @review agent

---

## Summary

인증/인가 레이어가 **일부 API 라우트에서 완전히 누락**되어 있어 인증 없이 제품 등록·수정·삭제 및 고객 문의 전체 열람이 가능한 상태입니다. 또한 이메일 템플릿에 사용자 입력이 비가공(raw) 상태로 삽입되어 XSS 위험이 있습니다. 보안 관련 HIGH 항목 7개, MEDIUM 5개, LOW 4개가 발견되었습니다.

---

## 🔴 HIGH (머지 전 반드시 수정)

### [H1] 이메일 템플릿에서 사용자 입력 미살균으로 인한 XSS

- **File:** `src/app/api/inquiries/route.ts` line 96–107
- **Issue:** `name`, `phoneNumber`, `email`, `company`, `message` 등 사용자 입력값이 HTML 이스케이프 없이 이메일 본문에 직접 삽입됨. 메일 클라이언트가 HTML을 렌더링하면 악의적 스크립트가 실행될 수 있음.
- **Risk:** 관리자 메일 클라이언트에서 XSS 실행, 피싱·세션 탈취 가능.
- **Fix:**
```ts
// 이스케이프 헬퍼 추가
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 템플릿 적용
html: `
  <p><strong>이름:</strong> ${escapeHtml(name)}</p>
  <p><strong>연락처:</strong> ${escapeHtml(phoneNumber)}</p>
  ...
  <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
`
```

---

### [H2] 문의 목록 GET — 인증 없이 모든 고객 정보 열람 가능

- **File:** `src/app/api/inquiries/route.ts` line 13–27
- **Issue:** `GET /api/inquiries`에 관리자 인증 체크가 없음. 누구나 URL 직접 호출로 전체 문의(이름, 연락처, 이메일, 내용) 열람 가능.
- **Risk:** 개인정보 유출, GDPR/개인정보보호법 위반.
- **Fix:**
```ts
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!isAdminPayload(authResult)) return authResult;

  try { /* 기존 로직 */ }
}
```

---

### [H3] 제품 POST — 인증 없이 제품 등록 가능

- **File:** `src/app/api/products/route.ts` line 40
- **Issue:** `POST /api/products`에 `requireAdmin` 호출 없음. 누구나 제품을 등록할 수 있음.
- **Risk:** 악의적 데이터 삽입, DB 오염.
- **Fix:** 핸들러 시작 부분에 auth 체크 추가.
```ts
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!isAdminPayload(authResult)) return authResult;
  // ...
}
```

---

### [H4] 제품 PATCH — 인증 없이 제품 수정 가능

- **File:** `src/app/api/products/[id]/route.ts` line 58
- **Issue:** `PATCH /api/products/:id`에 인증 없음.
- **Risk:** 공개 제품 정보 무단 수정.
- **Fix:** H3와 동일 패턴으로 auth 체크 추가.

---

### [H5] 제품 DELETE — 인증 없이 제품 삭제 가능

- **File:** `src/app/api/products/[id]/route.ts` line 111
- **Issue:** `DELETE /api/products/:id`에 인증 없음.
- **Risk:** 전체 제품 목록 삭제 가능.
- **Fix:** H3와 동일 패턴으로 auth 체크 추가.

---

### [H6] 카테고리 POST/DELETE — 인증 없이 카테고리 조작 가능

- **File:** `src/app/api/categories/route.ts` line 37, 61
- **Issue:** 카테고리 생성·삭제에 인증 없음.
- **Risk:** 카테고리 구조 무단 변경으로 제품 분류 파괴 가능.
- **Fix:** 각 핸들러 시작에 auth 체크 추가.

---

### [H7] 로그아웃 GET 메서드 — CSRF 취약점

- **File:** `src/app/api/auth/logout/route.ts` line 3
- **Issue:** 로그아웃이 `GET` 메서드로 구현됨. 공격자가 `<img src="/api/auth/logout">` 태그 하나로 관리자를 강제 로그아웃시킬 수 있음.
- **Risk:** 서비스 방해(DoS), 관리자 세션 강제 종료.
- **Fix:** `GET` → `POST`로 변경하고 클라이언트도 `fetch('/api/auth/logout', { method: 'POST' })`로 수정.

---

## 🟡 MEDIUM (빠른 시일 내 수정 권고)

### [M1] `parseInt` / `Number` 결과에 `isNaN` 검사 누락

- **File:** `src/app/api/products/[id]/route.ts` line 24 (GET/PATCH/DELETE 공통)
- **File:** `src/app/api/categories/route.ts` line 23, 71, 78
- **Issue:** `parseInt("abc")` → `NaN`. NaN을 Prisma에 그대로 넘기면 DB 드라이버 에러가 발생하고 500으로 흘러나감. 반면 `inquiries/[id]/route.ts`는 `isNaN` 검사를 올바르게 수행함 — 불일치.
- **Fix:**
```ts
const productId = parseInt(id);
if (isNaN(productId)) {
  return NextResponse.json({ success: false, message: '잘못된 ID입니다.' }, { status: 400 });
}
```

---

### [M2] 제품 POST 후 불필요한 두 번째 DB 쿼리

- **File:** `src/app/api/products/route.ts` line 58–79
- **Issue:** `prisma.product.create` 후 즉시 `prisma.product.findUnique`를 호출함. `create` 시 `include`를 사용하면 쿼리 하나로 해결됨.
- **Fix:**
```ts
const newProduct = await prisma.product.create({
  data: { name, categoryId: Number(categoryId), spec, description, imageUrl, isVisible: true },
  include: { category: true },
});
const formattedProduct = {
  ...newProduct,
  category: newProduct.category.name,
  companyId: newProduct.category.companyId,
};
```

---

### [M3] Prisma 클라이언트가 프로덕션에서도 쿼리 로그 출력

- **File:** `src/lib/prisma.ts` line 16–18
- **Issue:** `log: ['query']`가 항상 활성화되어 있어 프로덕션 로그에 SQL 쿼리가 그대로 노출됨. 성능 부담 + 민감 데이터 유출 가능성.
- **Fix:**
```ts
new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})
```

---

### [M4] `useProductAdmin.handleDelete` — 응답 확인 없이 낙관적 UI 업데이트

- **File:** `src/hooks/useProductAdmin.ts` line 201–207
- **Issue:** 삭제 API 응답을 확인하지 않고 바로 로컬 상태에서 제거함. 삭제 실패 시 UI는 사라졌지만 DB에는 남아 있는 불일치 발생. `useInquiry.handleDelete`는 이를 올바르게 처리하고 있음 — 불일치.
- **Fix:**
```ts
const handleDelete = async (id: number) => {
  if (!confirm('삭제하시겠습니까?')) return;
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (res.ok && data.success) {
    setProducts(prev => prev.filter(p => p.id !== id));
  } else {
    alert(`삭제 실패: ${data.message || '서버 오류'}`);
  }
};
```

---

### [M5] API 라우트 간 유효성 검사 방식 불일치

- **File:** `src/app/api/products/route.ts` (POST), `src/app/api/products/[id]/route.ts` (PATCH)
- **Issue:** PATCH는 Zod 스키마를 사용하지만 POST는 `if (!name || !categoryId)` 수동 검사를 사용함. 동일한 리소스에 대해 일관성이 없음.
- **Fix:** POST에도 Zod 스키마(`productCreateSchema`)를 정의하여 적용.

---

## 🟢 LOW (품질 개선)

### [L1] Zod 스키마에 불필요한 `.partial()` 중복

- **File:** `src/app/api/products/[id]/route.ts` line 7–14
- **Issue:** `productUpdateSchema`의 모든 필드가 이미 `.optional()`인데 마지막에 `.partial()`을 또 호출함. 동작에는 영향 없지만 코드가 혼란스러움.
- **Fix:** `.partial()` 제거.

---

### [L2] `isAdminPayload` 타입 가드가 취약한 heuristic 사용

- **File:** `src/lib/admin-auth.ts` line 15–18
- **Issue:** `typeof (result as any).status !== 'number'`로 구분하는 방식은 페이로드에 `status` 필드가 추가될 경우 오탐 가능. `instanceof NextResponse`가 더 명확함.
- **Fix:**
```ts
export function isAdminPayload(result: NextResponse | AdminPayload): result is AdminPayload {
  return !(result instanceof NextResponse);
}
```

---

### [L3] `imageUrl` Zod 검사 — 빈 문자열 허용 불가

- **File:** `src/app/api/products/[id]/route.ts` line 12
- **Issue:** `z.string().url()`은 빈 문자열을 통과시키지 않음. 이미지 제거를 허용하려면 `.or(z.literal(''))` 또는 `z.string().url().optional()`로 처리해야 함.

---

### [L4] 이미지 업로드 오류 메시지에 상세 정보 누락

- **File:** `src/hooks/useProductAdmin.ts` line 110
- **Issue:** `alert("이미지 업로드 실패")`만 표시하고 구체적인 오류 내용을 숨김. 디버깅이 어려움. `console.error(error)` 추가 권고.

---

## Positives (잘 된 점)

- `requireAdmin` + `isAdminPayload` 패턴이 `verify` 라우트에서 올바르게 사용됨 — 잘 설계된 auth 레이어.
- 로그인 시 타이밍 공격을 방지하는 메시지 통일 처리(`아이디 또는 비밀번호가 올바르지 않습니다.`).
- `inquiries/route.ts`에서 DB 저장과 메일 발송을 단계별로 분리하고 각 단계에서 명확한 `errorCode`/`stage` 반환 — 오류 추적이 용이한 구조.
- `inquiries/[id]/route.ts`에서 `isNaN(id)` 검사를 올바르게 수행.
- `useInquiry`에서 `res.ok && data.success` 이중 확인으로 UI 불일치 방지.
- bcrypt 해싱으로 비밀번호 안전하게 저장.
- 쿠키에 `httpOnly: true`, `sameSite: 'strict'` 적용.

---

## Action Items

| 우선순위 | 항목 | 파일 |
|---|---|---|
| 🔴 HIGH | 이메일 HTML 이스케이프 처리 (H1) | `api/inquiries/route.ts` |
| 🔴 HIGH | 문의 GET 인증 추가 (H2) | `api/inquiries/route.ts` |
| 🔴 HIGH | 제품 POST/PATCH/DELETE 인증 추가 (H3~H5) | `api/products/route.ts`, `api/products/[id]/route.ts` |
| 🔴 HIGH | 카테고리 POST/DELETE 인증 추가 (H6) | `api/categories/route.ts` |
| 🔴 HIGH | 로그아웃 GET → POST 변경 (H7) | `api/auth/logout/route.ts` |
| 🟡 MEDIUM | `parseInt`/`Number` NaN 검사 추가 (M1) | 다수 |
| 🟡 MEDIUM | 제품 POST 이중 쿼리 제거 (M2) | `api/products/route.ts` |
| 🟡 MEDIUM | Prisma 로그 프로덕션 분리 (M3) | `lib/prisma.ts` |
| 🟡 MEDIUM | `handleDelete` 응답 검사 추가 (M4) | `hooks/useProductAdmin.ts` |
| 🟡 MEDIUM | POST Zod 검사 일관화 (M5) | `api/products/route.ts` |
| 🟢 LOW | `.partial()` 중복 제거 (L1) | `api/products/[id]/route.ts` |
| 🟢 LOW | `isAdminPayload` instanceof 방식으로 변경 (L2) | `lib/admin-auth.ts` |
