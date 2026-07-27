# Shared Components 작업 가이드

`components/`에는 Navbar, Footer, PhoneButton처럼 두 개 이상 route/feature에서 재사용 가능한 표시 컴포넌트만 둔다.

- 도메인 API 호출·관리자 권한·페이지 전용 상태는 이 디렉터리에 넣지 않는다.
- 컴포넌트 API는 작고 명확한 props로 유지하고, 링크·버튼·이미지의 접근성 속성을 빠뜨리지 않는다.
- 전역 스타일 변경은 `app/globals.css`와 기존 디자인 토큰/유틸리티의 영향 범위를 확인한다.
