import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DAYBREAK} from '../theme';
import {Camera} from '../lib/seed';

export type Layer = {file: string; parallax: number};

/**
 * A plate presented as a pinned exhibit on the paper (or full-bleed for the hook):
 * paper margin, soft shadow, ink frame. The 2.5D layers each drift by their parallax
 * factor under a deterministic camera move (push-in / drift / pan / reveal). The
 * opaque base layer (parallax 0) always covers the frame — no gaps.
 */
export const ParallaxPlate: React.FC<{
  layers: Layer[];
  camera?: Camera;
  framed?: boolean;
  rect?: {x: number; y: number; w: number; h: number};
  progress?: number; // 0..1 override; defaults to frame across the scene
}> = ({layers, camera = 'push-in', framed = true, rect, progress}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = progress ?? Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const r = rect ?? (framed ? {x: 300, y: 118, w: 1320, h: 844} : {x: 0, y: 0, w: 1920, h: 1080});

  // Camera: scale + pan over the scene; each layer pans by its relative parallax.
  let scale = 1.06;
  let panX = 0;
  let panY = 0;
  if (camera === 'push-in') {
    scale = interpolate(t, [0, 1], [1.05, 1.15]);
  } else if (camera === 'drift') {
    scale = 1.08;
    panX = interpolate(t, [0, 1], [-44, 44]);
  } else if (camera === 'pan') {
    scale = 1.1;
    panX = interpolate(t, [0, 1], [-70, 70]);
  } else if (camera === 'reveal') {
    scale = interpolate(t, [0, 1], [1.18, 1.06]);
    panY = interpolate(t, [0, 1], [30, -10]);
  }

  const plate = (
    <>
      {layers.map((l, i) => (
        <Img
          key={i}
          src={staticFile(l.file)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${panX * l.parallax}px, ${panY * l.parallax}px)`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </>
  );

  if (!framed) {
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{plate}</div>
        <AbsoluteFill style={{boxShadow: 'inset 0 0 220px rgba(15,13,31,0.35)'}} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          overflow: 'hidden',
          backgroundColor: DAYBREAK.paper,
          boxShadow: '0 18px 44px rgba(15,13,31,0.30)',
          border: `2px solid ${DAYBREAK.ink}`,
          outline: `10px solid ${DAYBREAK.paper}`,
        }}
      >
        {plate}
        <div style={{position: 'absolute', inset: 14, border: `2px solid rgba(35,32,65,0.32)`, pointerEvents: 'none'}} />
      </div>
    </AbsoluteFill>
  );
};
