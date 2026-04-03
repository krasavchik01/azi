import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export const AnimatedText: React.FC<{
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, fontSize = 48, fontWeight = "700", color = "#fff", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        opacity,
        transform: `translateY(${translateY}px)`,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
