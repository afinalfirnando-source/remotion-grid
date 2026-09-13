import React from 'react';
import { Composition } from 'remotion';
import { GridDots } from './components/GridDots';
import { palettes } from './utils/colors';

const FPS = 30;
const DURATION = FPS * 10; // 10 seconds = 300 frames

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GridWave"
        component={() => (
          <GridDots
            palette={palettes.ocean}
            rows={20}
            cols={35}
            speed={1}
            width={3840}
            height={2160}
            dotSize={12}
            totalFrames={DURATION}
          />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />

      <Composition
        id="GridWaveNeon"
        component={() => (
          <GridDots
            palette={palettes.neon}
            rows={20}
            cols={35}
            speed={1}
            width={3840}
            height={2160}
            dotSize={12}
            totalFrames={DURATION}
          />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
    </>
  );
};
