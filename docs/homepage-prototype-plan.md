# 홈페이지 프로토타입 개선 계획

## 목표

- 기존 메인 페이지는 바로 수정하지 않고 `/design-demo`에서 방향을 먼저 검증한다.
- 새 문구를 과하게 만들지 않고, 현재 사이트에 이미 있는 표현을 재조합한다.
- 제품 이미지는 하드코딩하지 않고 기존 DB에 등록된 제품 이미지를 자동 전환 형태로 보여준다.
- 사이트 목적은 결제가 아니라 `견적 및 제휴 문의`, `제품 도입을 위한 전문 상담`, `문의 접수`로 명확히 둔다.

## 참고 방향

- 구조는 SMC처럼 제품군 탐색과 문의 동선을 우선한다.
- 시각 톤은 Festo처럼 정돈된 산업 자동화 느낌을 참고한다.
- 신뢰감은 Parker처럼 산업재 기업의 묵직한 톤을 참고한다.
- Apple식 저밀도 제품 쇼케이스는 그대로 쓰지 않는다. 공압부품 사이트에는 정보 탐색성과 문의 전환이 더 중요하다.

## 기존 사이트에서 재사용할 문구

### 메인 메시지 후보
np
```text
산업용 공압 부품 전문 기업
```

```text
신뢰할 수 있는 기술, 검증된 안정성
```

```text
제품 도입을 위한 전문 상담부터 견적 및 제휴 문의까지
담당자가 확인 후 신속하게 연락드립니다.
```

### 보조 문구 후보

```text
책임 있는 계약과 지속적인 지원으로
고객의 비즈니스 성장을 꾸준히 돕습니다.
```

```text
공압 부품과 산업용 부품을 확인하고,
필요한 제품은 전문 상담을 신청하세요.
```

```text
파카(Parker), 노그린(IMI), 공압전문메이커(SNS Pneumatic),
케이시시공압(KCC), SMC 등 공압 전문 제품을 상담합니다.
```

### CTA 문구 후보

- 제품 보기
- 견적 및 제휴 문의
- 무료 상담 신청하기
- 문의하기
- 전화 문의

## 메인 화면 구성안

### 1. Hero

목적: 방문자가 3초 안에 `공압부품 전문 기업`, `제품 상담`, `견적 문의` 사이트임을 이해하게 한다.

권장 문구:

```text
산업용 공압 부품 전문 기업
```

```text
제품 도입을 위한 전문 상담부터 견적 및 제휴 문의까지
담당자가 확인 후 신속하게 연락드립니다.
```

CTA:

- 견적 및 제휴 문의
- 제품 보기
- 전화 문의

우측 또는 하단 비주얼:

- DB에서 가져온 주력 제품 이미지 자동 전환
- 제품명, 카테고리, 스펙을 함께 표시
- 제품 클릭 시 `/products/[id]`로 이동

### 2. 신뢰/업무 요약 바

첨부 이미지의 4칸 영역은 `문의 전환을 위한 신뢰/업무 프로세스 요약 바`로 사용한다.

기존 문구 기반 4칸:

| 제목 | 설명 |
| --- | --- |
| 견적 및 제휴 문의 | 담당자가 확인 후 신속하게 연락드립니다 |
| 전문 상담 | 제품 도입을 위한 상담을 신청하세요 |
| 주력 제품 안내 | 공압 부품과 산업용 부품을 확인하세요 |
| 지속적인 지원 | 책임 있는 계약과 지원을 제공합니다 |

짧은 버전:

| 제목 | 설명 |
| --- | --- |
| 견적 문의 | 담당자 확인 후 신속 연락 |
| 전문 상담 | 제품 도입 상담 신청 |
| 주력 제품 | 공압 부품 안내 |
| 지속 지원 | 책임 있는 계약과 지원 |

### 3. 주력 제품 안내

목적: 현재 DB 제품을 활용해 사이트가 실제 운영 중인 것처럼 보이게 한다.

구성:

- 기존 `getFeaturedProducts(4)` 또는 제품 목록 API 사용
- 카드에는 `이미지`, `카테고리`, `스펙`, `제품명`, `설명` 표시
- 이미지가 없으면 중립 배경과 카테고리 약어 표시
- 제품 클릭 시 상세 페이지 이동

문구:

```text
주력 제품 안내
```

```text
최고의 기술력이 담긴 최신 제품을 만나보세요.
```

### 4. 주요 파트너사

목적: 취급 브랜드와 신뢰감을 빠르게 제공한다.

구성:

- 기존 `PARTNERS` 상수 사용
- Parker, IMI Norgren, SNS Pneumatic, KCC, CYPAG 로고 표시
- 각 로고는 기존 파트너 URL로 이동

문구:

```text
주요 파트너사 홈페이지
```

또는

```text
공압 전문 제품을 상담합니다.
```

### 5. 하단 문의 CTA

목적: 제품을 못 찾은 사용자도 이탈하지 않고 문의하게 한다.

문구:

```text
원하시는 제품을 찾지 못하셨나요?
```

```text
저희는 고객의 요구사항에 맞춘 커스텀 솔루션도 제공하고 있습니다.
담당자와의 1:1 상담을 통해 최적의 제안을 받아보세요.
```

CTA:

- 무료 상담 신청하기

### 6. 제품군별 PDF 카탈로그

목적: 제품군별 카탈로그 PDF를 사용자가 바로 확인하거나 다운로드할 수 있게 한다.

초기 구현은 DB를 건드리지 않는 정적 파일 방식으로 진행한다. 제품군별 PDF가 고정 자료라면 `public/catalogs`에 파일을 두고 코드에서 매핑하는 방식이 가장 단순하고 안정적이다.

권장 문구:

```text
카탈로그
제품군별 PDF 자료를 확인하거나 다운로드할 수 있습니다.
```

카드 문구 예시:

```text
방향 제어 밸브
제품 사양과 적용 정보를 확인하세요.
```

```text
에어 실린더
보어, 스트로크, 장착 방식 관련 자료입니다.
```

```text
피팅 / 튜브
규격과 연결 방식 자료입니다.
```

버튼:

- PDF 보기
- 다운로드

파일 구조 예시:

```text
public/catalogs/valves.pdf
public/catalogs/cylinders.pdf
public/catalogs/fittings-tubes.pdf
public/catalogs/frl.pdf
```

데이터 매핑 예시:

```ts
const catalogs = [
  {
    title: "방향 제어 밸브",
    description: "제품 사양과 적용 정보를 확인하세요.",
    file: "/catalogs/valves.pdf",
  },
  {
    title: "에어 실린더",
    description: "보어, 스트로크, 장착 방식 관련 자료입니다.",
    file: "/catalogs/cylinders.pdf",
  },
  {
    title: "피팅 / 튜브",
    description: "규격과 연결 방식 자료입니다.",
    file: "/catalogs/fittings-tubes.pdf",
  },
];
```

링크 구현 예시:

```tsx
<a href="/catalogs/valves.pdf" target="_blank" rel="noopener noreferrer">
  PDF 보기
</a>

<a href="/catalogs/valves.pdf" download>
  다운로드
</a>
```

사용 기준:

- `PDF 보기`는 새 탭에서 PDF를 연다.
- `다운로드`는 사용자가 파일을 저장할 수 있게 한다.
- 모바일에서는 PDF 내장 뷰어보다 새 탭 열기가 안전하다.
- 파일명은 영문 소문자와 하이픈을 사용한다.
- 카탈로그가 늘어나면 추후 관리자 업로드, DB, 파일 스토리지 구조를 별도로 설계한다.

## DB 이미지 자동 전환 계획

### 데이터

사용 대상:

- 제품 ID
- 제품명
- 카테고리
- 스펙
- 설명
- 이미지 URL

우선순위:

1. `getFeaturedProducts(4)`로 주력 제품을 가져온다.
2. 주력 제품이 없으면 빈 상태 문구를 보여준다.
3. 이미지가 없는 제품은 카테고리 약어와 중립 배경을 보여준다.

### 동작

- 히어로 제품 이미지는 4~5초마다 자동 전환한다.
- 사용자가 제품 영역을 클릭하면 해당 제품 상세 페이지로 이동한다.
- 제품 이미지, 제품명, 카테고리, 스펙이 함께 전환된다.
- 전환 효과는 과하지 않게 `fade` 또는 `slide`만 사용한다.

### 구현 메모

- 서버 컴포넌트에서 제품 데이터를 받아 클라이언트 캐러셀 컴포넌트로 전달한다.
- 예시 구조:

```text
src/app/design-demo/page.tsx
src/app/design-demo/HomePrototypeClient.tsx
```

- `page.tsx`
  - 제품 데이터 fetch
  - 기존 사이트 문구 기반 섹션 구성

- `HomePrototypeClient.tsx`
  - 이미지 자동 전환
  - 현재 제품 index 상태 관리
  - 클릭 시 상세 페이지 이동

## 디자인 원칙

- 기존 사이트 문구를 우선 사용한다.
- 새 표현이 필요하면 기존 문구와 충돌하지 않는 짧은 업무형 표현만 사용한다.
- 쇼핑몰처럼 `구매`, `장바구니`, `가격`을 강조하지 않는다.
- 문의형 사이트이므로 `제품 보기`, `견적 및 제휴 문의`, `전문 상담`, `전화 문의`가 핵심 액션이다.
- 제품 이미지는 실제 DB 이미지를 우선한다.
- 카드와 섹션은 너무 장식적으로 만들지 않고, 산업재 B2B 사이트처럼 단정하게 구성한다.

## CSS 방향

목표는 `산업용 공압 부품 전문 기업`에 맞는 단정한 B2B 사이트 느낌이다. 기존 메인처럼 둥근 배너와 강한 그림자를 많이 쓰기보다, 제품 탐색과 문의 전환이 잘 보이는 차분한 레이아웃을 우선한다.

### 색상

기본 팔레트:

```css
:root {
  --color-ink: #141416;
  --color-body: #303236;
  --color-muted: #6f737a;
  --color-line: #dde1e7;
  --color-blue: #0066cc;
  --color-blue-dark: #004f9f;
  --color-black: #050506;
  --color-paper: #f5f7fa;
  --color-panel: #ffffff;
  --color-pale: #eef3f8;
}
```

사용 기준:

- 액션 색상은 `--color-blue` 하나를 중심으로 사용한다.
- 본문 배경은 `--color-paper`, 주요 카드와 입력 영역은 `--color-panel`을 사용한다.
- 헤더나 브랜드 신뢰 영역처럼 무게감이 필요한 곳에만 `--color-black`을 사용한다.
- 빨강, 초록, 보라 등 보조 강조색은 쓰지 않는다. 상태 표현이 꼭 필요할 때만 제한적으로 추가한다.

### 타이포그래피

```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--color-ink);
  background: var(--color-paper);
}

.hero-title {
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.04;
  letter-spacing: -1.4px;
  font-weight: 800;
}

.section-title {
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.15;
  letter-spacing: -0.7px;
  font-weight: 800;
}

.body-copy {
  font-size: 17px;
  line-height: 1.55;
  color: var(--color-body);
}

.muted-copy {
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-muted);
}
```

사용 기준:

- 히어로 제목은 크고 명확하게 둔다.
- 카드 안 텍스트는 과하게 작게 만들지 않는다.
- 문구는 짧게 유지하되, 산업재 사이트답게 `제품`, `상담`, `견적`, `문의`, `지원` 같은 기존 단어를 사용한다.

### 레이아웃

```css
.page-shell {
  background: var(--color-paper);
}

.container {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.section {
  padding: 72px 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.82fr);
  gap: 42px;
  align-items: center;
}
```

사용 기준:

- 전체 폭은 `1180px` 정도로 잠근다.
- 메인 히어로는 좌측 문구, 우측 DB 제품 이미지 영역으로 둔다.
- 너무 넓은 여백만 있는 랜딩 페이지보다, 첫 화면 안에서 검색/문의/제품 이미지가 모두 보이게 한다.
- 섹션 간 여백은 충분히 주되, 제품 탐색성이 떨어질 정도로 비우지 않는다.

### 헤더

```css
.demo-header {
  height: 52px;
  background: var(--color-black);
  color: #fff;
}

.demo-header-inner {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo-nav {
  display: flex;
  gap: 22px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}
```

사용 기준:

- 헤더는 얇고 단정하게 둔다.
- 메뉴는 `제품군`, `브랜드`, `기술자료`, `문의`처럼 B2B 탐색 흐름에 맞춘다.
- 모바일에서는 메뉴를 숨기고 브랜드명과 문의 버튼 중심으로 단순화한다.

### 버튼

```css
.button-primary {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--color-blue);
  color: #fff;
  padding: 0 18px;
  font-size: 15px;
  font-weight: 700;
}

.button-secondary {
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  color: var(--color-ink);
  padding: 0 18px;
  font-size: 15px;
  font-weight: 700;
}
```

사용 기준:

- 주요 액션은 `견적 및 제휴 문의`, `문의하기`, `무료 상담 신청하기`에만 사용한다.
- `제품 보기`, `전화 문의`, `사진 문의`는 보조 버튼으로 둔다.
- 버튼에 과한 그림자나 그라데이션을 넣지 않는다.

### 검색/문의 바

```css
.search-inquiry-bar {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  max-width: 720px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--color-line);
  background: var(--color-paper);
}

.search-inquiry-input {
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0 12px;
  font-size: 16px;
  outline: none;
}
```

사용 기준:

- 검색창 placeholder는 `모델명, 브랜드, 제품군 검색`처럼 실제 사용자가 입력할 값을 보여준다.
- 검색만 강조하지 말고 `사진 문의`, `견적 요청`을 함께 둔다.
- 모바일에서는 검색창, 사진 문의, 견적 요청을 세로로 쌓는다.

### 제품 이미지 캐러셀

```css
.hero-product-panel {
  min-height: 360px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #eef3f8 100%);
  border: 1px solid var(--color-line);
  overflow: hidden;
}

.hero-product-image {
  width: 100%;
  height: 280px;
  object-fit: contain;
}

.hero-product-meta {
  border-top: 1px solid var(--color-line);
  padding: 16px 18px;
  background: #fff;
}
```

사용 기준:

- 실제 DB 이미지가 있으면 `object-fit: contain`으로 제품 전체가 보이게 한다.
- 제품 이미지를 `cover`로 잘라내지 않는다. 산업 부품은 형태와 규격이 중요하다.
- 이미지가 없으면 중립 배경과 카테고리 약어를 보여준다.
- 자동 전환은 `4~5초` 간격으로 둔다.
- 전환 효과는 `opacity` 기반 fade 정도로 제한한다.

### 신뢰/업무 요약 바

첨부 이미지에 해당하는 4칸 바의 CSS 기준:

```css
.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--color-line);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.trust-item {
  padding: 22px;
  border-right: 1px solid var(--color-line);
}

.trust-item:last-child {
  border-right: 0;
}

.trust-title {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-ink);
}

.trust-desc {
  display: block;
  margin-top: 7px;
  font-size: 14px;
  color: var(--color-muted);
}
```

사용 기준:

- 이 영역은 장식 카드가 아니라 `문의 전환 전 신뢰 정보`다.
- 문구는 기존 사이트 표현 기반으로 간결하게 둔다.
- 모바일에서는 2열 또는 1열로 접는다.

### 제품군 카드

```css
.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.category-card {
  min-height: 184px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  background: #fff;
}

.category-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: var(--color-pale);
  border: 1px solid var(--color-line);
}
```

사용 기준:

- 제품군은 `밸브`, `실린더`, `피팅/튜브`, `FRL`, `진공 부품`, `센서/스위치`처럼 실제 탐색 단위로 둔다.
- 카드에 불필요한 그림자와 과한 hover 효과를 넣지 않는다.
- 제품군 클릭 시 추후 `/products/category/[id]` 또는 검색 결과로 연결할 수 있게 설계한다.

### 파트너/브랜드 영역

```css
.brand-section {
  background: var(--color-black);
  color: #fff;
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.brand-card {
  min-height: 76px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
}
```

사용 기준:

- 브랜드 영역은 신뢰감을 주는 어두운 섹션으로 둔다.
- 실제 반영 시에는 기존 `PARTNERS` 로고를 우선 사용한다.
- 브랜드 로고가 작거나 해상도가 낮으면 텍스트 카드로 대체해도 된다.

### 하단 CTA

```css
.bottom-cta {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 34px;
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: #fff;
}
```

사용 기준:

- 하단 CTA는 `원하시는 제품을 찾지 못하셨나요?` 문구를 살린다.
- 사용자가 제품을 못 찾았을 때도 문의로 이어지게 한다.
- 모바일에서는 CTA 버튼을 세로 배치한다.

### PDF 카탈로그 섹션

```css
.catalog-section {
  background: var(--color-panel);
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.catalog-card {
  padding: 22px;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  background: #fff;
}

.catalog-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-muted);
}

.catalog-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
```

사용 기준:

- 카탈로그 섹션은 제품군 카드 다음 또는 파트너사 영역 전후에 배치한다.
- `PDF 보기`와 `다운로드` 버튼을 같이 제공한다.
- 카탈로그 카드에는 제품군명, 짧은 설명, 파일 형식 정보를 보여준다.
- 파일 크기를 알 수 있으면 `PDF · 12.4MB`처럼 표시한다.
- 모바일에서는 카탈로그 카드를 1열로 접고 버튼은 세로 배치한다.

### 반응형 기준

```css
@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .trust-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-grid,
  .brand-grid,
  .catalog-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .container {
    width: min(100% - 24px, 1180px);
  }

  .search-inquiry-bar,
  .bottom-cta,
  .catalog-actions {
    grid-template-columns: 1fr;
  }

  .button-primary,
  .button-secondary {
    width: 100%;
  }
}
```

사용 기준:

- 모바일에서 텍스트와 버튼이 겹치지 않아야 한다.
- 제품 이미지는 모바일에서도 잘리지 않고 전체 형태가 보여야 한다.
- 검색/문의 바는 모바일에서 반드시 세로 배치한다.

## 다음 작업 순서

1. `/design-demo`의 문구를 기존 사이트 표현 기반으로 교체한다.
2. DB 제품 이미지를 사용하는 히어로 자동 전환 컴포넌트를 만든다.
3. 4칸 신뢰/업무 요약 바를 기존 문구 기반으로 정리한다.
4. 주력 제품 안내와 파트너사 영역을 기존 데이터와 연결한다.
5. 브라우저에서 데스크톱/모바일 화면을 확인한다.
6. 방향이 괜찮으면 실제 `src/app/page.tsx`에 반영할 범위를 별도로 정한다.
