import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { AnimatedCard } from "../components/AnimatedCard";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const pillars = [
  {
    letter: "E",
    title: "Environmental",
    subtitle: "Экология",
    items: ["Углеродный след", "Энергоэффективность", "Управление отходами"],
    color: COLORS.envGreen,
    delay: 10,
  },
  {
    letter: "S",
    title: "Social",
    subtitle: "Социальное",
    items: ["Условия труда", "Разнообразие", "Права человека"],
    color: COLORS.socialBlue,
    delay: 22,
  },
  {
    letter: "G",
    title: "Governance",
    subtitle: "Управление",
    items: ["Прозрачность", "Антикоррупция", "Этика бизнеса"],
    color: COLORS.govPurple,
    delay: 34,
  },
];

export const WhatIsESGSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background variant="gradient" />

      <AbsoluteFill
        style={{
          padding: "80px 120px",
          flexDirection: "column",
          gap: 50,
        }}
      >
        <div style={{ opacity: titleOpacity }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: COLORS.accentGreen,
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 12,
            }}
          >
            Основы
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
            }}
          >
            Три столпа ESG
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, flex: 1 }}>
          {pillars.map((p, i) => (
            <AnimatedCard
              key={i}
              delay={p.delay}
              style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: p.color,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 36,
                  fontWeight: "900",
                  color: "#fff",
                }}
              >
                {p.letter}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: "700", color: COLORS.lightText }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 20, color: COLORS.subtleText, marginTop: 4 }}>
                  {p.subtitle}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {p.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      fontSize: 20,
                      color: COLORS.lightText,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: p.color,
                        flexShrink: 0,
                      }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </AnimatedCard>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
