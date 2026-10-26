import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from './Paper';
import {DAYBREAK} from './theme';

/**
 * Checkpoint-1 placeholder composition. Its only job is to prove the Remotion
 * project renders 10 s at 1080p30 on the Daybreak paper, with a little motion so
 * the pacing rule (no static still) is respected even by the placeholder.
 * Real templates replace this at Checkpoint 6.
 */
export const Placeholder: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const rise = spring({frame, fps, config: {damping: 200}});
  const underline = interpolate(frame, [20, 55], [0, 520], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(frame, [0, durationInFrames], [-14, 14]);

  return (
    <Paper>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translateX(${drift}px)`,
        }}
      >
        <div style={{textAlign: 'center', opacity: rise}}>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 92,
              fontWeight: 700,
              color: DAYBREAK.ink,
              letterSpacing: 1,
            }}
          >
            Read<span style={{color: DAYBREAK.coral}}>Lark</span>
          </div>
          <svg width="640" height="40" style={{marginTop: 8}}>
            <line
              x1="60"
              y1="20"
              x2={60 + underline}
              y2="20"
              stroke={DAYBREAK.amber}
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 30,
              color: DAYBREAK.ink,
              opacity: 0.7,
              marginTop: 18,
            }}
          >
            video factory · placeholder
          </div>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
