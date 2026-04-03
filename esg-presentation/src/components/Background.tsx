import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../styles";

export const Background: React.FC<{ variant?: "dark" | "gradient" }> = ({
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowX = interpolate(frame, [0, 4 * fps], [20, 80], {
    extrapolateRight: "clamp",
  });
  const glowY = interpolate(frame, [0, 4 * fps], [30, 60], {
    extrapolateRight: "clamp",
  });

  const bg =
    variant === "gradient"
      ? `radial-gradient(ellipse at ${glowX}% ${glowY}%, rgba(0,214,143,0.15) 0%, ${COLORS.darkBg} 70%)`
      : `radial-gradient(ellipse at ${glowX}% ${glowY}%, ${COLORS.deepBlue} 0%, ${COLORS.darkBg} 70%)`;

  return (
    <AbsoluteFill
      style={{
        background: bg,
      }}
    />
  );
};
