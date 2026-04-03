import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { CountUp } from "../components/CountUp";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const metrics = [
  { value: 85, suffix: "%", label: "Сокращение времени\nна отчётность", delay: 10 },
  { value: 10, suffix: "x", label: "Ускорение сбора\nданных", delay: 18 },
  { value: 99, suffix: "%", label: "Точность данных\nпосле валидации", delay: 26 },
  { value: 40, suffix: "%", label: "Снижение затрат\nна комплаенс", delay: 34 },
];

export const MetricsSlide = () => {
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
          gap: 60,
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
            Результаты
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
            }}
          >
            Цифры говорят сами
          </div>
        </div>

        <div style={{ display: "flex", gap: 48, justifyContent: "space-between" }}>
          {metrics.map((m, i) => {
            const cardProgress = spring({
              frame,
              fps,
              delay: m.delay,
              config: { damping: 200 },
            });
            const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);
            const cardScale = interpolate(cardProgress, [0, 1], [0.8, 1]);

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 16,
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                }}
              >
                <CountUp
                  to={m.value}
                  suffix={m.suffix}
                  delay={m.delay}
                  fontSize={96}
                  color={COLORS.accentGreen}
                />
                <div
                  style={{
                    fontSize: 22,
                    color: COLORS.subtleText,
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                  }}
                >
                  {m.label}
                </div>

                {/* Decorative bar */}
                <div
                  style={{
                    width: 60,
                    height: 3,
                    background: COLORS.cardBorder,
                    borderRadius: 2,
                    marginTop: 8,
                  }}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
