# Upload 패키지 작업 가이드

## 책임

`upload`은 관리자 제품 이미지 업로드의 `POST /api/uploads/images`와 Cloudinary 서명 업로드만 소유한다. 제품 Entity 저장·수정과 이미지 URL의 사용 결정은 product 패키지 책임이다.

## 보안 및 계약

- endpoint는 Spring Security의 관리자 인증·CSRF 정책을 따른다. controller에서 이를 우회하지 않는다.
- `multipart/form-data`의 `file`만 받고, 허용 형식은 JPEG/PNG/WebP/GIF, 최대 크기는 현재 5 MiB다. 제한 변경은 프론트 검증과 함께 검토한다.
- Cloudinary secret, signature payload, 원본 파일 바이트/이름, 전체 외부 오류를 로그나 HTTP 응답에 노출하지 않는다.
- `CLOUDINARY_*` 설정만 사용한다. 브라우저에 API secret을 보내거나 unsigned upload로 임의 변경하지 않는다.
- Cloudinary 응답의 `secure_url` 누락 및 외부 실패는 공통 오류 형식으로 안전하게 처리한다.

## 구현 및 검증

- `RestClient`와 서명 파라미터를 한 곳에서 유지한다. URL/서명 생성 로직을 controller나 product 패키지로 복제하지 않는다.
- mock 기반으로 파일 검증, 설정 누락, 외부 실패, `secure_url` 성공 응답을 검증한다. 기본 테스트에서 실제 Cloudinary 호출은 하지 않는다.
