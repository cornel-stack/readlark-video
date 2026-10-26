import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DAYBREAK} from './theme';

/**
 * The warm-paper background shared by every scene. A subtle, deterministic
 * grain + vignette drawn in SVG (no external image) so it is licence-clean and
 * reproducible. Real paper texture arrives at Checkpoint 6; this is the base.
 */
export const Paper: React.FC<{children?: React.ReactNode}> = ({children}) => {
  return (
    <AbsoluteFill style={{backgroundColor: DAYBREAK.paper}}>
      <svg
        width="100%"
        height="100%"
        style={{position: 'absolute', inset: 0}}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="60%" stopColor={DAYBREAK.paper} stopOpacity="0" />
            <stop offset="100%" stopColor="#0f0d1f" stopOpacity="0.07" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>
      {children}
    </AbsoluteFill>
  );
};
