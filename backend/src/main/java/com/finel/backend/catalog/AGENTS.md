# Catalog 패키지 작업 가이드

- 관리자 분할 업로드와 확정 카탈로그 조회를 소유한다. 현재 HTTP 계약은 `docs/api-contract.md`의 0절을 따른다. 인증과 CSRF는 `config/SecurityConfig`에서 적용한다.
- 임시 파일은 공개하지 않는다. 외부 파일명을 경로로 사용하지 않고, API 응답에는 저장 경로를 포함하지 않는다. 다른 도메인은 `CatalogReader`로 문서 metadata만 조회한다.
- 파일 검증은 Linux 컨테이너의 `pdfinfo`를 별도 프로세스로 실행한다. `prlimit`으로 주소 공간 2 GiB, CPU 30초, 보고서 파일당 64 KiB를 제한하고 35초 이상 실행 시 종료한다. PDF 전체를 메모리에 올리지 않는다.
- 영구 볼륨은 단일 백엔드가 쓴다. 세션이 만료되거나 서버가 재시작되면 임시 파일을 정리한다. 확정 파일과 DB metadata의 일관성 확인 및 복구는 `deploy/README.md`를 따른다.
