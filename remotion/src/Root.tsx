import React from 'react';
import {Composition} from 'remotion';
import {Placeholder} from './Placeholder';
import {HandSample} from './HandSample';
import {FPS, HEIGHT, WIDTH} from './theme';

/**
 * Composition registry. Phase-1 placeholder only; the Main / Short / Thumbnail
 * compositions (data-driven, from scripts/<code>.json) are registered here at
 * Checkpoint 6.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Placeholder"
        component={Placeholder}
        durationInFrames={10 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="HandSample"
        component={HandSample}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
