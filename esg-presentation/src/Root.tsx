import { Composition } from "remotion";
import { ESGPresentation } from "./ESGPresentation";

export const RemotionRoot = () => {
  return (
    <Composition
      id="ESGPresentation"
      component={ESGPresentation}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
