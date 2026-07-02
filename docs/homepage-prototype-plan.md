# 홈페이지 프로토타입 개선 계획

## 목표

- 기존 제품 목록, 제품 상세, 문의, 관리자 기능은 유지한다.
- 메인 화면만 더 단정하고 가벼운 B2B 첫 화면으로 개편한다.
- 메인은 모든 정보를 넣는 랜딩 페이지가 아니라, 핵심 메시지와 주요 진입 경로만 제공한다.
- 사이트 목적은 결제가 아니라 `견적 및 제휴 문의`, `제품 도입을 위한 전문 상담`, `문의 접수`로 명확히 둔다.
- 새 문구를 과하게 만들지 않고, 현재 사이트에 이미 있는 표현을 재조합한다.
- CSS는 메인, 제품 목록, 제품 상세, 문의, 회사 소개 페이지가 서로 다른 사이트처럼 보이지 않도록 공통 토큰과 컴포넌트 스타일을 최대한 통일한다.

## 확정 방향

`public/prototypes/homepage-main.html`에서 확인한 것처럼 메인 화면은 다음 느낌으로 간다.

- 첫 화면은 히어로 중심으로 구성한다.
- 히어로에는 회사 성격, 상담/견적 CTA, 제품 검색/문의 바, 주력 제품 비주얼을 배치한다.
- 메인 하단은 `주력 제품 안내`와 `파트너/브랜드` 정도만 유지한다.
- 4칸 신뢰/업무 요약 바, 제품군 카드 목록, PDF 카탈로그, 하단 반복 CTA는 메인에서 제거한다.
- 제품군 탐색, 카탈로그, 상세한 제품 확인은 기존 `/products` 계열 페이지에서 담당한다.

## 유지할 기존 사이트 흐름

메인 화면만 단순화하고, 기존 사이트 구조는 유지한다.

```text
/                         메인: 핵심 메시지, 제품 검색/문의, 주력 제품, 파트너
/products                 제품 목록: 제품군 탐색, 검색, 전체 제품 확인
/products/[id]            제품 상세: 이미지, 스펙, 설명, 문의 연결
/products/category/[id]   카테고리별 제품 목록
/contact                  견적 및 제휴 문의
/about                    회사/파트너 정보
/privacy                  개인정보 처리방침
/chanyoung                관리자
```

메인에서 제거한 정보가 사라지는 것은 아니다. 정보량이 많은 탐색 기능은 `/products`, 상담 전환은 `/contact`, 브랜드/회사 설명은 `/about`처럼 각 페이지의 역할을 분리한다.

## 하위 페이지 디자인 통일 원칙

메인 화면만 새 디자인으로 바꾸고 하위 페이지가 기존 톤으로 남으면 사이트가 분리되어 보인다. 따라서 메인 개편과 함께 하위 페이지의 CSS 기준도 통일한다.

- 공통 색상 토큰, container 폭, section 간격, 버튼, 카드, 입력 필드 스타일을 전 페이지에서 공유한다.
- `/products`, `/products/category/[id]`, `/products/[id]`, `/contact`, `/about`은 같은 `surface-card`, `button-primary`, `button-secondary`, `product-image-panel` 기준을 사용한다.
- 페이지마다 별도 팔레트, 과한 그림자, 서로 다른 radius 체계를 만들지 않는다.
- 기존 기능과 URL 구조는 유지하되, 시각 표현만 새 기준으로 맞춘다.
- 관리자 `/chanyoung`은 기능성 UI이므로 이번 공개 사이트 디자인 통일 범위에서는 제외한다. 단, 깨진 스타일이나 명백한 사용성 문제는 별도 작업으로 다룬다.

## 참고 방향

- 구조는 산업재 B2B 사이트처럼 목적별 진입점을 분명히 둔다.
- 메인은 SMC처럼 제품 탐색으로 이어지는 입구 역할을 하되, 제품군 카드 전체를 반복하지 않는다.
- 시각 톤은 Festo처럼 정돈된 산업 자동화 느낌을 참고한다.
- 신뢰감은 Parker처럼 묵직하고 단정한 톤을 참고한다.
- Apple식 저밀도 쇼케이스를 그대로 쓰지는 않는다. 다만 메인 화면은 정보 과밀을 피하고 핵심 전환만 남긴다.

## 기존 사이트에서 재사용할 문구

### 메인 메시지 후보

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

- 견적 및 제휴 문의
- 제품 보기
- 전화 문의
- 문의하기

## 메인 화면 구성안

### 1. Hero

목적: 방문자가 3초 안에 `공압 부품 전문 기업`, `제품 상담`, `견적 문의` 사이트임을 이해하게 한다.

구성:

- 좌측: 메인 메시지, 보조 설명, CTA
- CTA: `견적 및 제휴 문의`, `제품 보기`, `전화 문의`
- 검색/문의 바: `모델명, 브랜드, 제품군 검색`, `사진 문의`, `견적 요청`
- 우측: DB 주력 제품 이미지 또는 중립 제품 비주얼

권장 문구:

```text
산업용 공압 부품 전문 기업
```

```text
제품 도입을 위한 전문 상담부터 견적 및 제휴 문의까지
담당자가 확인 후 신속하게 연락드립니다.
```

동작:

- `견적 및 제휴 문의`는 `/contact`로 이동한다.
- `제품 보기`는 `/products` 또는 메인 내 주력 제품 영역으로 이동한다.
- 제품 비주얼을 클릭하면 해당 제품 상세 페이지로 이동한다.
- 실제 DB 제품 이미지가 있으면 사용하고, 없으면 카테고리 약어 또는 단정한 placeholder를 보여준다.

### 2. 주력 제품 안내

목적: 메인에서 사이트가 실제 제품 데이터를 갖고 있음을 보여주고, 상세 페이지로 진입하게 한다.

구성:

- 기존 `getFeaturedProducts(4)` 또는 제품 목록 API 사용
- 카드에는 `이미지`, `카테고리`, `스펙`, `제품명`, `설명`을 표시한다.
- 제품 클릭 시 `/products/[id]`로 이동한다.
- 이미지는 `object-fit: contain`을 우선한다. 산업 부품은 형태와 규격이 중요하므로 `cover`로 잘라내지 않는다.

문구:

```text
주력 제품 안내
```

```text
최고의 기술력이 담긴 최신 제품을 만나보세요.
```

### 3. 주요 파트너사

목적: 취급 브랜드와 신뢰감을 빠르게 제공한다.

구성:

- 기존 `PARTNERS` 상수 사용
- Parker, IMI Norgren, SNS Pneumatic, KCC, CYPAG 로고 표시
- 각 로고는 기존 파트너 URL로 이동
- 로고 품질이 낮거나 비율이 맞지 않으면 텍스트 카드 대체를 허용한다.

문구:

```text
공압 전문 제품을 상담합니다.
```

## 메인에서 제외할 영역

아래 영역은 메인 화면에서 제거한다.

- 4칸 신뢰/업무 요약 바
- 제품군 카드 목록
- 제품군별 PDF 카탈로그
- 하단 반복 문의 CTA

이유:

- 메인 화면이 길고 반복적으로 보인다.
- 제품군 탐색은 `/products`가 담당하는 편이 자연스럽다.
- PDF 카탈로그는 별도 자료/제품 페이지나 추후 전용 섹션으로 분리하는 편이 낫다.
- 하단 CTA는 히어로 CTA와 역할이 겹친다.

## 기존 하위 페이지 유지 원칙

### 제품 목록 페이지

- `/products`는 계속 제품 탐색 중심 페이지로 유지한다.
- 검색, 카테고리 필터, 전체 제품 확인은 이 페이지에서 처리한다.
- 메인에서 제품군 카드가 사라져도 제품 탐색 기능은 줄이지 않는다.
- 메인 주력 제품 카드와 같은 카드/이미지/버튼 스타일을 사용한다.
- 제품 이미지는 목록에서도 `object-fit: contain`을 우선해 부품 형태가 잘리지 않게 한다.
- 카테고리 필터와 검색 UI는 메인 검색/문의 바의 입력 스타일과 최대한 맞춘다.

### 제품 상세 페이지

- `/products/[id]`는 `public/prototypes/product-detail.html`의 레이아웃을 기준으로 재정리한다.
- 제품 이미지, 스펙, 설명, 카탈로그, 관련 제품, 문의 연결을 유지한다.
- 메인 주력 제품 카드와 히어로 제품 비주얼은 상세 페이지로 연결한다.
- 상단은 `이미지 패널 + 정보 패널` 2단 구조를 기본으로 한다.
- 정보 패널에는 카테고리, 제품명, 요약 설명, 브랜드, 제품군, 스펙, 문의 방식, CTA를 배치한다.
- 상세 하단에는 스펙 테이블, 카탈로그 카드, 관련 제품 카드, sticky 문의 바를 둘 수 있다.
- 모바일에서는 이미지 패널과 정보 패널을 1열로 접고, sticky 문의 바가 본문을 가리지 않게 한다.

제품 상세 기준 구조:

```text
breadcrumb
product-shell
  image-panel
  info-panel
    category eyebrow
    product title
    summary
    meta-grid
    primary/secondary actions
spec-table
catalog-card
related-products
sticky-inquiry
```

### 문의 페이지

- `/contact`는 견적 및 제휴 문의의 최종 전환 페이지로 유지한다.
- 메인 CTA는 모두 `/contact`로 자연스럽게 연결한다.

### 관리자 페이지

- `/chanyoung` 관리자 기능은 이번 UI 방향 변경 범위 밖이다.
- 제품 등록/수정/삭제, 문의 관리는 기존 기능을 유지한다.

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
2. 주력 제품이 없으면 메인 제품 비주얼 영역에 단정한 빈 상태를 보여준다.
3. 이미지가 없는 제품은 카테고리 약어와 중립 배경을 보여준다.

### 동작

- 히어로 제품 이미지는 4~5초마다 자동 전환한다.
- 사용자가 제품 영역을 클릭하면 해당 제품 상세 페이지로 이동한다.
- 제품 이미지, 제품명, 카테고리, 스펙이 함께 전환된다.
- 전환 효과는 과하지 않게 `fade` 정도만 사용한다.

### 구현 메모

```text
src/app/page.tsx
src/app/HomeHeroClient.tsx
```

- `page.tsx`
  - 제품 데이터 fetch
  - 히어로, 주력 제품, 파트너사 섹션 구성

- `HomeHeroClient.tsx`
  - 이미지 자동 전환
  - 현재 제품 index 상태 관리
  - 클릭 시 상세 페이지 이동

프로토타입 검증은 `public/prototypes/homepage-main.html`로 진행하고, 방향이 확정되면 실제 `src/app/page.tsx`에 반영한다.

하위 페이지 CSS 통일은 다음 테스트 HTML로 먼저 확인한다.

```text
public/prototypes/products-list.html   제품 목록 기준안
public/prototypes/product-detail.html  제품 상세 기준안
public/prototypes/contact.html         문의 페이지 기준안
public/prototypes/about.html           회사 소개 기준안
```

## 디자인 원칙

- 기존 사이트 문구를 우선 사용한다.
- 새 표현이 필요하면 기존 문구와 충돌하지 않는 짧은 업무형 표현만 사용한다.
- 쇼핑몰처럼 `구매`, `장바구니`, `가격`을 강조하지 않는다.
- 문의형 사이트이므로 `제품 보기`, `견적 및 제휴 문의`, `전문 상담`, `전화 문의`가 핵심 액션이다.
- 제품 이미지는 실제 DB 이미지를 우선한다.
- 카드와 섹션은 너무 장식적으로 만들지 않고, 산업재 B2B 사이트처럼 단정하게 구성한다.
- 메인과 하위 페이지의 CSS 토큰, 버튼, 카드, 섹션 간격을 통일한다.

## CSS 통일 방향

목표는 메인, 제품 목록, 제품 상세, 문의, 회사 소개 페이지가 같은 디자인 시스템 안에 있는 것처럼 보이게 하는 것이다.

### 공통 색상 토큰

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
- 본문 배경은 `--color-paper`, 카드와 입력 영역은 `--color-panel`을 사용한다.
- 헤더나 브랜드 영역처럼 무게감이 필요한 곳에만 `--color-black`을 사용한다.
- 빨강, 초록, 보라 등 보조 강조색은 상태 표현이 꼭 필요할 때만 제한적으로 추가한다.

### 공통 타이포그래피

```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--color-ink);
  background: var(--color-paper);
}

.hero-title {
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.05;
  letter-spacing: 0;
  font-weight: 900;
}

.section-title {
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.16;
  letter-spacing: 0;
  font-weight: 900;
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

- 음수 letter-spacing은 쓰지 않는다.
- 히어로 제목은 크고 명확하게 둔다.
- 카드 안 텍스트는 과하게 작게 만들지 않는다.
- 제품, 상담, 견적, 문의, 지원 같은 기존 단어를 중심으로 쓴다.

### 공통 레이아웃

```css
.page-shell {
  background: var(--color-paper);
}

.container {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.section {
  padding: 62px 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.84fr);
  gap: 44px;
  align-items: center;
}
```

사용 기준:

- 전체 폭은 `1180px` 정도로 잠근다.
- 메인 히어로는 좌측 문구, 우측 제품 이미지 영역으로 둔다.
- 제품 목록/상세/문의 페이지도 같은 container 폭과 section 간격을 사용한다.
- 카드 내부 여백, border, radius는 페이지마다 다르게 만들지 않는다.

### 공통 버튼

```css
.button-primary {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--color-blue);
  color: #fff;
  padding: 0 18px;
  font-size: 15px;
  font-weight: 800;
}

.button-secondary {
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  color: var(--color-ink);
  padding: 0 18px;
  font-size: 15px;
  font-weight: 800;
}
```

사용 기준:

- 주요 액션은 `견적 및 제휴 문의`, `문의하기`, `견적 요청`에만 사용한다.
- `제품 보기`, `전화 문의`, `사진 문의`는 보조 버튼으로 둔다.
- 버튼에 과한 그림자나 그라데이션을 넣지 않는다.

### 공통 카드

```css
.surface-card {
  border: 1px solid var(--color-line);
  border-radius: 12px;
  background: var(--color-panel);
  overflow: hidden;
}
```

사용 기준:

- 제품 카드, 브랜드 카드, 폼 영역은 같은 border/radius 기준을 쓴다.
- 카드 안에 또 카드처럼 보이는 중첩 구조를 만들지 않는다.
- hover 효과는 색상 변화나 border 강조 정도로 제한한다.

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
- 모바일에서는 검색창, 사진 문의, 견적 요청을 세로로 쌓는다.
- 제품 목록 페이지 검색 UI도 같은 입력 스타일을 최대한 재사용한다.

### 제품 이미지 영역

```css
.product-image-panel {
  min-height: 360px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #eef3f8 100%);
  border: 1px solid var(--color-line);
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 280px;
  object-fit: contain;
}
```

사용 기준:

- 실제 DB 이미지가 있으면 `object-fit: contain`으로 제품 전체가 보이게 한다.
- 제품 이미지를 `cover`로 잘라내지 않는다.
- 메인 히어로, 제품 목록 카드, 제품 상세의 이미지 처리 기준을 맞춘다.

### 제품 상세 전용 패턴

제품 상세 페이지는 `public/prototypes/product-detail.html`의 패턴을 따른다.

```css
.product-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 22px;
  align-items: start;
}

.image-panel,
.info-panel,
.catalog-card,
.related-card {
  border: 1px solid var(--color-line);
  border-radius: 16px;
  background: var(--color-panel);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
}

.sticky-inquiry {
  position: sticky;
  bottom: 0;
  border-top: 1px solid var(--color-line);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}
```

사용 기준:

- 상세 페이지의 이미지 패널은 제품 사진이나 placeholder가 크게 보이는 첫 번째 정보 영역이다.
- 정보 패널은 구매 페이지처럼 가격을 강조하지 않고, 상담/견적 CTA를 중심에 둔다.
- 스펙은 자유 텍스트보다 표 구조로 정리한다.
- 카탈로그가 있는 제품은 상세 페이지 안에서 PDF 보기/다운로드를 제공한다.
- 관련 제품 카드는 제품 목록 카드와 같은 시각 기준을 사용한다.
- sticky 문의 바는 데스크톱에서만 과하지 않게 쓰고, 모바일에서는 버튼이 콘텐츠를 가리지 않도록 여백을 확보한다.

### 브랜드 영역

```css
.brand-section {
  background: var(--color-black);
  color: #fff;
}

.brand-card {
  min-height: 76px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
}
```

사용 기준:

- 브랜드 영역은 신뢰감을 주는 어두운 섹션으로 둔다.
- 기존 `PARTNERS` 로고를 우선 사용한다.
- 로고가 작거나 해상도가 낮으면 텍스트 카드로 대체한다.

### 반응형 기준

```css
@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .product-grid,
  .brand-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .container {
    width: min(100% - 24px, 1180px);
  }

  .search-inquiry-bar {
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

## 구현 범위

### 이번 메인 개편에 포함

- `src/app/page.tsx` 메인 구조 개편
- 필요한 경우 `src/app/HomeHeroClient.tsx` 추가
- 공통 CSS 토큰과 버튼/카드/섹션 스타일 정리
- 공개 하위 페이지의 CSS 통일
- `public/prototypes/product-detail.html` 기준의 제품 상세 페이지 스타일 반영
- `getFeaturedProducts(4)` 기반 주력 제품 유지
- `PARTNERS` 기반 파트너 영역 유지

### 이번 메인 개편에서 제외

- 제품 목록 페이지 기능 삭제
- 제품 상세 페이지 기능 삭제
- 제품 상세 페이지의 기존 데이터 계약 변경
- 문의 폼 정책 변경
- 관리자 UI 개편
- 전역 PDF 카탈로그 페이지 신규 구현
- DB/Flyway/Spring API 계약 변경

## 다음 작업 순서

1. `public/prototypes/homepage-main.html` 기준으로 메인 방향을 최종 확인한다.
2. `public/prototypes/product-detail.html` 기준으로 제품 상세 페이지 레이아웃을 확정한다.
3. `products-list.html`, `contact.html`, `about.html`로 하위 페이지의 공통 CSS 톤을 확인한다.
4. 공통 CSS 토큰과 버튼/카드/섹션 스타일을 실제 앱 CSS에 반영할 범위를 정한다.
5. `src/app/page.tsx`를 히어로, 주력 제품, 파트너사 중심으로 개편한다.
6. `/products/[id]`를 `product-detail.html` 기준으로 정리한다.
7. 제품 목록, 제품 상세, 문의, 회사 소개 페이지가 같은 CSS 톤으로 보이는지 확인한다.
8. 제품 목록, 제품 상세, 문의 페이지가 기존대로 접근 가능한지 확인한다.
9. 데스크톱/모바일에서 메인/상세 텍스트, 버튼, 제품 이미지가 겹치지 않는지 확인한다.
10. `npm run lint`와 `npm run build`로 실제 반영 결과를 검증한다.
