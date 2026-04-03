import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { AnimatedCard } from "../components/AnimatedCard";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const steps = [
  {
    num: "01",
    title: "Сбор данных",
    desc: "Автоматический импорт из ERP, CRM, IoT-датчиков и внешних API",
    delay: 10,
  },
  {
    num: "02",
    title: "Обработка и анализ",
    desc: "AI-алгоритмы нормализуют, валидируют и обогащают данные",
    delay: 22,
  },
  {
    num: "03",
    title: "Формирование отчётов",
    desc: "Генерация отчётов по стандартам GRI, SASB, TCFD, CDP",
    delay: 34,
  },
  {
    num: "04",
    title: "Мониторинг и алерты",
    desc: "Real-time дашборды и оповещения при отклонениях",
    delay: 46,
  },
];

export const AutomationSlide = () => {
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
            Как это работает
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
            }}
          >
            Автоматизация в 4 шага
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, flex: 1, alignItems: "stretch" }}>
          {steps.map((step, i) => {
            const progress = spring({
              frame,
              fps,
              delay: step.delay,
              config: { damping: 200 },
            });
            const lineWidth = interpolate(progress, [0, 1], [0, 1]);

            return (
              <AnimatedCard
                key={i}
                delay={step.delay}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${lineWidth * 100}%`,
                    height: 3,
                    background: COLORS.accentGreen,
                  }}
                />

                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "900",
                    color: COLORS.accentGreen,
                    opacity: 0.3,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: "700",
                    color: COLORS.lightText,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: COLORS.subtleText,
                    lineHeight: 1.5,
                  }}
                >
                  {step.desc}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
