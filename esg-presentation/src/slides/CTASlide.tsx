import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

export const CTASlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, delay: 5, config: { damping: 12 } });
  const subtitleProgress = spring({ frame, fps, delay: 15, config: { damping: 200 } });
  const buttonProgress = spring({ frame, fps, delay: 25, config: { damping: 200 } });
  const footerProgress = spring({ frame, fps, delay: 35, config: { damping: 200 } });

  const titleScale = interpolate(titleProgress, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);
  const buttonOpacity = interpolate(buttonProgress, [0, 1], [0, 1]);
  const buttonScale = interpolate(buttonProgress, [0, 1], [0.9, 1]);
  const footerOpacity = interpolate(footerProgress, [0, 1], [0, 1]);

  // Pulsing glow on the button
  const pulse = interpolate(frame % (2 * fps), [0, fps, 2 * fps], [0.3, 0.6, 0.3]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background variant="gradient" />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 36,
        }}
      >
        {/* Main CTA */}
        <div
          style={{
            fontSize: 72,
            fontWeight: "900",
            color: COLORS.lightText,
            textAlign: "center",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            lineHeight: 1.2,
          }}
        >
          Готовы автоматизировать
          <br />
          <span style={{ color: COLORS.accentGreen }}>ESG-отчётность?</span>
        </div>

        <div
          style={{
            fontSize: 28,
            color: COLORS.subtleText,
            textAlign: "center",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Начните с бесплатного аудита ваших процессов.
          <br />
          Покажем, где автоматизация даст максимальный эффект.
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: buttonOpacity,
            transform: `scale(${buttonScale})`,
            marginTop: 16,
          }}
        >
          <div
            style={{
              background: COLORS.gradientGreen,
              padding: "22px 64px",
              borderRadius: 16,
              fontSize: 28,
              fontWeight: "700",
              color: "#fff",
              boxShadow: `0 0 ${40 + pulse * 40}px rgba(0,214,143,${pulse})`,
            }}
          >
            Запросить демо
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            opacity: footerOpacity,
            display: "flex",
            gap: 40,
            alignItems: "center",
          }}
        >
          {["GRI", "SASB", "TCFD", "CDP", "EU CSRD"].map((std, i) => (
            <div
              key={i}
              style={{
                fontSize: 16,
                color: COLORS.subtleText,
                padding: "8px 20px",
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 8,
              }}
            >
              {std}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
