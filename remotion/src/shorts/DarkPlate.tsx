import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Full-bleed, dimmed public-domain painting behind a philosophy short: a very slow
 * push-in (Ken Burns), heavy vignette, film grain, and a dark wash so the serif text
 * stays legible. 2D only — no depth needed for this register.
 */
export const DarkPlate: React.FC<{src: string; seed?: number}> = ({src, seed = 0}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const scale = interpolate(t, [0, 1], [1.12, 1.26]);
  const drift = interpolate(t, [0, 1], [-18, 18]) * (seed % 2 === 0 ? 1 : -1);

  return (
    <AbsoluteFill style={{backgroundColor: '#0C0A12'}}>
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${drift}px)`,
          filter: 'brightness(0.62) saturate(0.82) contrast(1.05)',
        }}
      />
      {/* dark wash + vignette for legibility */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(12,10,18,0.55) 0%, rgba(12,10,18,0.15) 38%, rgba(12,10,18,0.78) 100%)'}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 420px rgba(0,0,0,0.85)'}} />
      {/* film grain */}
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay'}}>
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};
