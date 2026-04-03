import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

const layers = [
  {
    title: "Визуализация",
    items: ["Дашборды", "Отчёты PDF", "API для BI-систем"],
    color: COLORS.accentGreen,
    delay: 10,
  },
  {
    title: "AI & Аналитика",
    items: ["NLP для документов", "Прогнозные модели", "Аномалии"],
    color: COLORS.socialBlue,
    delay: 20,
  },
  {
    title: "Движок данных",
    items: ["ETL-пайплайны", "Валидация", "Нормализация"],
    color: COLORS.govPurple,
    delay: 30,
  },
  {
    title: "Интеграции",
    items: ["ERP / CRM", "IoT-датчики", "Открытые данные"],
    color: "#e67e22",
    delay: 40,
  },
];

export const StackSlide = () => {
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
            Архитектура
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: COLORS.lightText,
            }}
          >
            Технологический стек
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            justifyContent: "center",
          }}
        >
          {layers.map((layer, i) => {
            const progress = spring({
              frame,
              fps,
              delay: layer.delay,
              config: { damping: 200 },
            });
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            const slideX = interpolate(progress, [0, 1], [-100, 0]);
            const barWidth = interpolate(progress, [0, 1], [0, 100]);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 32,
                  opacity,
                  transform: `translateX(${slideX}px)`,
                }}
              >
                {/* Left bar */}
                <div
                  style={{
                    width: 6,
                    height: 80,
                    background: layer.color,
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                />

                {/* Layer content */}
                <div
                  style={{
                    background: COLORS.cardBg,
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: 16,
                    padding: "24px 36px",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Progress bar bg */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barWidth}%`,
                      background: `${layer.color}08`,
                    }}
                  />

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: COLORS.lightText,
                      zIndex: 1,
                    }}
                  >
                    {layer.title}
                  </div>

                  <div style={{ display: "flex", gap: 24, zIndex: 1 }}>
                    {layer.items.map((item, j) => (
                      <div
                        key={j}
                        style={{
                          fontSize: 18,
                          color: COLORS.subtleText,
                          background: "rgba(255,255,255,0.05)",
                          padding: "8px 16px",
                          borderRadius: 8,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
