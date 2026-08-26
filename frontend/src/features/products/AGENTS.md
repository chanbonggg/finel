# Products Feature 작업 가이드

`features/products`는 공개 제품 카드, 검색, 목록의 클라이언트 상호작용을 소유한다.

- 검색은 공개 API/전달받은 visible 데이터만 사용하고 debounce·loading·빈 결과를 명확히 처리한다.
- route metadata와 서버 데이터 패칭은 `app/products`에 남기며 feature에서 숨김 제품이나 관리자 endpoint를 사용하지 않는다.
- 카드의 링크·이미지·검색 컨트롤은 키보드와 보조기술로 사용할 수 있게 유지한다.
