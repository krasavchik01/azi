import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { AnimatedCard } from "../components/AnimatedCard";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const benefits = [
  {
    icon: "🎯",
    title: "Соответствие стандартам",
    desc: "Автоматическое формирование отчётов по GRI, SASB, TCFD и другим фреймворкам",
    delay: 10,
  },
  {
    icon: "🔄",
    title: "Единая платформа",
    desc: "Все ESG-данные в одном месте — от углеродного следа до HR-метрик",
    delay: 20,
  },
  {
    icon: "📈",
    title: "Прогнозная аналитика",
    desc: "ML-модели предсказывают ESG-риски и рекомендуют корректирующие действия",
    delay: 30,
  },
  {
    icon: "🔒",
    title: "Аудит и прозрачность",
    desc: "Полный audit trail — каждое изменение данных отслеживается и документируется",
    delay: 40,
  },
];

export const BenefitsSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

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
            Преимущества
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
            }}
          >
            Что вы получаете
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            flex: 1,
          }}
        >
          {benefits.map((b, i) => (
            <AnimatedCard key={i} delay={b.delay} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div
                style={{
                  fontSize: 44,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {b.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: "700",
                    color: COLORS.lightText,
                    marginBottom: 8,
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontSize: 19,
                    color: COLORS.subtleText,
                    lineHeight: 1.5,
                  }}
                >
                  {b.desc}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
