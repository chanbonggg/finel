import type { CSSProperties } from "react";

const colors = {
  ink: "#141416",
  body: "#303236",
  muted: "#6f737a",
  line: "#dde1e7",
  blue: "#0066cc",
  blueDark: "#004f9f",
  black: "#050506",
  paper: "#f5f7fa",
  panel: "#ffffff",
  pale: "#eef3f8",
};

const font: CSSProperties = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const categories = [
  ["방향 제어 밸브", "Solenoid / mechanical valve", "모델명, 포트 수, 전압 기준"],
  ["에어 실린더", "Standard / compact / rodless", "보어, 스트로크, 장착 방식 기준"],
  ["피팅 & 튜브", "One-touch fitting / tube", "나사 규격, 외경, 재질 기준"],
  ["FRL / 압력 제어", "Filter / regulator / lubricator", "압력 범위, 유량, 포트 기준"],
  ["진공 부품", "Ejector / pad / vacuum switch", "흡착 조건, 패드 재질 기준"],
  ["센서 / 스위치", "Auto switch / pressure switch", "배선, 출력, 설치 환경 기준"],
];

const brands = ["Parker", "SMC", "IMI Norgren", "SNS", "KCC", "Festo"];

const pageStyle: CSSProperties = {
  ...font,
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  overflowY: "auto",
  background: colors.paper,
  color: colors.ink,
};

const container: CSSProperties = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto",
};

const buttonPrimary: CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 8,
  background: colors.blue,
  color: "#fff",
  padding: "0 18px",
  fontSize: 15,
  fontWeight: 700,
};

const buttonSecondary: CSSProperties = {
  minHeight: 44,
  border: `1px solid ${colors.line}`,
  borderRadius: 8,
  background: "#fff",
  color: colors.ink,
  padding: "0 18px",
  fontSize: 15,
  fontWeight: 700,
};

function ProductIllustration() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: 360,
        borderRadius: 18,
        background: "linear-gradient(180deg, #ffffff 0%, #eef3f8 100%)",
        border: `1px solid ${colors.line}`,
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "12% 10%",
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.05)",
          background: "rgba(255,255,255,0.55)",
        }}
      />
      <div
        style={{
          width: "74%",
          height: 124,
          borderRadius: 14,
          background: "#d8dde5",
          border: "1px solid #bfc6d0",
          boxShadow: "0 22px 50px rgba(20, 28, 38, 0.22)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-11%",
            top: 38,
            width: "22%",
            height: 48,
            borderRadius: 8,
            background: "#f8fafc",
            border: "1px solid #c9d0da",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-11%",
            top: 38,
            width: "22%",
            height: 48,
            borderRadius: 8,
            background: "#f8fafc",
            border: "1px solid #c9d0da",
          }}
        />
        {[18, 36, 54, 72].map((left) => (
          <div
            key={left}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: -22,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "#fff",
              border: "1px solid #c9d0da",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "22%",
            right: "22%",
            bottom: 20,
            height: 9,
            borderRadius: 999,
            background: colors.blue,
          }}
        />
      </div>
    </div>
  );
}

export default function DesignDemoPage() {
  return (
    <div style={pageStyle}>
      <header style={{ background: colors.black, color: "#fff" }}>
        <div
          style={{
            ...container,
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <strong style={{ fontSize: 19, letterSpacing: "-0.2px" }}>FineL Pneumatics</strong>
          <nav
            style={{
              display: "flex",
              gap: 22,
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            <span>제품군</span>
            <span>브랜드</span>
            <span>기술자료</span>
            <span>문의</span>
          </nav>
        </div>
      </header>

      <main>
        <section style={{ background: colors.panel, borderBottom: `1px solid ${colors.line}` }}>
          <div
            style={{
              ...container,
              padding: "72px 0 46px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 0.82fr)",
              gap: 42,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ color: colors.blue, fontSize: 15, fontWeight: 800, margin: "0 0 18px" }}>
                산업용 공압부품 견적 · 대체품 상담
              </p>
              <h1
                style={{
                  fontSize: "clamp(38px, 5vw, 62px)",
                  lineHeight: 1.04,
                  letterSpacing: "-1.4px",
                  margin: 0,
                  maxWidth: 680,
                }}
              >
                모델명을 몰라도,
                <br />
                필요한 부품을 찾게.
              </h1>
              <p
                style={{
                  margin: "22px 0 0",
                  color: colors.body,
                  fontSize: 19,
                  lineHeight: 1.58,
                  maxWidth: 640,
                }}
              >
                밸브, 실린더, 피팅, FRL, 진공 부품까지 현장 조건과 사양을 기준으로
                제품 확인과 견적 문의를 빠르게 이어줍니다.
              </p>

              <div
                style={{
                  marginTop: 30,
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 10,
                  maxWidth: 720,
                  padding: 8,
                  borderRadius: 12,
                  border: `1px solid ${colors.line}`,
                  background: colors.paper,
                }}
              >
                <input
                  placeholder="모델명, 브랜드, 제품군 검색"
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: "0 12px",
                    fontSize: 16,
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <button style={buttonSecondary}>사진 문의</button>
                <button style={buttonPrimary}>견적 요청</button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                {["Parker 밸브", "SMC 실린더", "피팅 규격", "대체품 상담"].map((chip) => (
                  <span
                    key={chip}
                    style={{
                      borderRadius: 999,
                      background: colors.pale,
                      color: colors.blueDark,
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <ProductIllustration />
          </div>
        </section>

        <section style={{ ...container, padding: "34px 0" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              border: `1px solid ${colors.line}`,
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {[
              ["견적 응답", "영업일 기준 빠른 확인"],
              ["대체품", "동급 사양 비교 제안"],
              ["납기", "수량별 공급 가능성 확인"],
              ["상담", "전화 · 카카오 · 폼 문의"],
            ].map(([title, desc]) => (
              <div key={title} style={{ padding: 22, borderRight: `1px solid ${colors.line}` }}>
                <strong style={{ display: "block", fontSize: 18 }}>{title}</strong>
                <span style={{ display: "block", marginTop: 7, color: colors.muted, fontSize: 14 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...container, padding: "34px 0 72px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 20 }}>
            <div>
              <p style={{ color: colors.blue, fontWeight: 800, margin: "0 0 10px" }}>Product categories</p>
              <h2 style={{ fontSize: 36, letterSpacing: "-0.7px", margin: 0 }}>제품군으로 바로 찾기</h2>
            </div>
            <button style={buttonSecondary}>전체 제품 보기</button>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {categories.map(([title, subtitle, desc]) => (
              <article
                key={title}
                style={{
                  background: "#fff",
                  border: `1px solid ${colors.line}`,
                  borderRadius: 14,
                  padding: 22,
                  minHeight: 184,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      background: colors.pale,
                      border: `1px solid ${colors.line}`,
                      marginBottom: 18,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: 21, letterSpacing: "-0.3px" }}>{title}</h3>
                  <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 14 }}>{subtitle}</p>
                </div>
                <p style={{ margin: "18px 0 0", color: colors.body, fontSize: 15, lineHeight: 1.45 }}>
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ background: colors.black, color: "#fff" }}>
          <div
            style={{
              ...container,
              padding: "66px 0",
              display: "grid",
              gridTemplateColumns: "0.85fr 1.15fr",
              gap: 42,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ color: "#8fc4ff", fontWeight: 800, margin: "0 0 10px" }}>Brands</p>
              <h2 style={{ fontSize: 36, letterSpacing: "-0.7px", margin: 0 }}>취급 브랜드 중심 상담</h2>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 17, lineHeight: 1.55, marginTop: 16 }}>
                브랜드, 모델명, 현장 조건을 함께 확인해 단순 판매보다 정확한 사양 확인에 집중합니다.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {brands.map((brand) => (
                <div
                  key={brand}
                  style={{
                    minHeight: 76,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.06)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...container, padding: "72px 0" }}>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${colors.line}`,
              borderRadius: 18,
              padding: 34,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.6px" }}>
                사진 한 장으로도 문의할 수 있게.
              </h2>
              <p style={{ margin: "10px 0 0", color: colors.muted, fontSize: 16, lineHeight: 1.5 }}>
                제품 사진, 장비 명판, 기존 모델명 중 하나만 있어도 확인 가능한 상담 흐름을 만듭니다.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={buttonSecondary}>전화 상담</button>
              <button style={buttonPrimary}>문의 남기기</button>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 900px) {
          header nav { display: none !important; }
          main section > div {
            grid-template-columns: 1fr !important;
          }
          input {
            min-height: 44px;
          }
          section div[style*="repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section div[style*="repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 560px) {
          div[style*="grid-template-columns: 1fr auto auto"] {
            grid-template-columns: 1fr !important;
          }
          button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
