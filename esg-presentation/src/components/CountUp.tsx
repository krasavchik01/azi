import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export const CountUp: React.FC<{
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
  fontSize?: number;
  color?: string;
}> = ({ from = 0, to, suffix = "", prefix = "", delay = 0, fontSize = 72, color = "#00d68f" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame - delay, [0, 2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const value = Math.round(interpolate(progress, [0, 1], [from, to]));

  return (
    <div
      style={{
        fontSize,
        fontWeight: "800",
        color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}{value}{suffix}
    </div>
  );
};
