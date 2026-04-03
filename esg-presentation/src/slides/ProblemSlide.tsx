import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { AnimatedCard } from "../components/AnimatedCard";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const problems = [
  { icon: "📊", text: "Ручной сбор данных из 10+ источников", delay: 10 },
  { icon: "⏰", text: "200+ часов в год на подготовку отчётов", delay: 20 },
  { icon: "⚠️", text: "Ошибки и несоответствия в данных", delay: 30 },
  { icon: "📋", text: "Сложность соблюдения стандартов GRI, SASB, TCFD", delay: 40 },
];

export const ProblemSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{
          padding: "80px 120px",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
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
            Проблема
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
              lineHeight: 1.2,
            }}
          >
            Почему компании теряют время?
          </div>
        </div>

        {/* Problem cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginTop: 20,
          }}
        >
          {problems.map((p, i) => (
            <AnimatedCard key={i} delay={p.delay}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 40 }}>{p.icon}</div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: "400",
                    color: COLORS.lightText,
                  }}
                >
                  {p.text}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
