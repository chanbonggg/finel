# Spring API client 변경 기록

- 브라우저는 `NEXT_PUBLIC_API_BASE_URL`, 서버는 `SERVER_API_BASE_URL` 우선으로 Spring API를 호출한다.
- 모든 요청에 credentials를 포함하고 JSON body에만 Content-Type을 설정한다.
- 로그인과 관리자 변경 요청은 CSRF 토큰을 메모리에 보관해 `X-XSRF-TOKEN`으로 전송한다.
- 제품, 카테고리, 문의, 인증, sitemap 계약별 함수를 분리했다.
- 검증: `npm run lint`, `npm run build`, 브라우저 credentials/CSRF 흐름 대상이다.
- 서버 요청은 `SERVER_API_BASE_URL`, 그 다음 `NEXT_PUBLIC_API_BASE_URL`을 사용하며 둘 다 없으면 상대 URL을 만들지 않고 명시적 설정 오류를 발생시킨다.
- build/prerender에서는 설정 오류에 한해 home은 빈 featured, 상세/category는 404, sitemap은 정적 URL만 생성하도록 안전 fallback한다.
- 브라우저의 빈 base 상대 `/api` fallback은 Next API 삭제 게이트 전 rollback 호환을 위해 유지한다.
