import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {NIGHT, SERIF} from '../theme';

/**
 * One line of a philosophy short, centred, large serif, rising and fading with the
 * narration. `localDur` is the beat's length in frames (the component lives inside a
 * Sequence, so the frame is already beat-relative).
 */
export const KineticText: React.FC<{text: string; localDur: number; emphasis?: boolean}> = ({text, localDur, emphasis}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200, mass: 0.6}});
  const fadeOut = interpolate(frame, [localDur - 10, localDur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(rise, fadeOut);

  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        top: '50%',
        transform: `translateY(calc(-50% + ${(1 - rise) * 26}px))`,
        textAlign: 'center',
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: emphasis ? 700 : 500,
          fontStyle: emphasis ? 'normal' : 'normal',
          fontSize: text.length > 90 ? 58 : text.length > 50 ? 70 : 86,
          lineHeight: 1.28,
          color: emphasis ? NIGHT.amber : NIGHT.bone,
          textShadow: '0 4px 30px rgba(0,0,0,0.9)',
          letterSpacing: 0.3,
        }}
      >
        {text}
      </div>
    </div>
  );
};
