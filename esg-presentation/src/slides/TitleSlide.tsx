import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Background } from "../components/Background";
import { COLORS } from "../styles";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});

export const TitleSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const titleProgress = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const subtitleProgress = spring({ frame, fps, delay: 20, config: { damping: 200 } });
  const lineWidth = interpolate(
    spring({ frame, fps, delay: 15, config: { damping: 200 } }),
    [0, 1],
    [0, 200]
  );

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background variant="gradient" />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ESG Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: COLORS.gradientGreen,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${logoScale})`,
            marginBottom: 16,
            boxShadow: "0 0 60px rgba(0,214,143,0.3)",
          }}
        >
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 82,
            fontWeight: "900",
            color: COLORS.lightText,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            letterSpacing: -2,
          }}
        >
          Автоматизация ESG
        </div>

        {/* Accent Line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: COLORS.gradientGreen,
            borderRadius: 2,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            fontWeight: "400",
            color: COLORS.subtleText,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          Умные решения для экологической, социальной
          <br />и корпоративной отчётности
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
