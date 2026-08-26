# Frontend 작업 가이드

## 범위와 구조

이 문서는 `frontend/` 전체에 적용된다. Next.js App Router 화면은 `src/app`, 재사용 UI는 `src/components`, 도메인별 클라이언트 기능은 `src/features`, Spring API 호출은 `src/lib/api`가 소유한다.

## 핵심 규칙

- API 계약의 기준은 `../docs/api-contract.md`다. 브라우저에서 `fetch`를 새로 만들기보다 `src/lib/api`의 타입 있는 함수를 확장한다.
- 서버 렌더링 코드와 클라이언트 훅/상호작용을 분리한다. 필요한 경우에만 `'use client'`를 선언하고, 비밀값은 `NEXT_PUBLIC_*`으로 노출하지 않는다.
- 관리자 변경 요청은 API client의 credentials/CSRF 흐름을 유지한다. `proxy.ts`는 UI guard일 뿐 보안 경계가 아니다.
- 공개 제품은 숨김 데이터를 노출하지 않으며, SSR 오류는 페이지별 `notFound`·fallback 정책을 지킨다.
- 스타일은 기존 Tailwind/CSS 패턴과 접근성(의미 있는 버튼·label·alt·키보드 조작)을 유지한다.

## 검증

```powershell
npm run lint
npm run build
```

환경변수는 `.env.local`만 사용하고 실제 URL·secret은 출력하거나 커밋하지 않는다.

