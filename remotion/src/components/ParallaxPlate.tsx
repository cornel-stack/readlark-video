import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {DAYBREAK} from '../theme';

export type Layer = {file: string; parallax: number};

/**
 * A plate presented as a pinned exhibit on the paper: a paper margin, soft shadow,
 * ink frame. The 2.5D layers (from tools/depth_layers) each drift by their parallax
 * factor under a slow push-in, giving depth. If `layers` is a single entry it is a
 * flat 2D move. `t` is 0..1 progress of the camera move across the scene.
 */
export const ParallaxPlate: React.FC<{
  layers: Layer[];
  t: number;
  frameRect?: {x: number; y: number; w: number; h: number};
  pan?: number; // horizontal camera travel in px that parallax multiplies
}> = ({layers, t, frameRect, pan = 120}) => {
  const rect = frameRect ?? {x: 300, y: 120, w: 1320, h: 840};
  const push = interpolate(t, [0, 1], [1.0, 1.08]); // slow push-in
  const camX = interpolate(t, [0, 1], [-pan / 2, pan / 2]);

  return (
    <AbsoluteFill>
      {/* pinned plate frame on the paper */}
      <div
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          overflow: 'hidden',
          backgroundColor: DAYBREAK.paper,
          boxShadow: '0 18px 40px rgba(15,13,31,0.28)',
          border: `2px solid ${DAYBREAK.ink}`,
          outline: `10px solid ${DAYBREAK.paper}`,
        }}
      >
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
              transform: `scale(${push}) translateX(${camX * l.parallax * 40}px)`,
              transformOrigin: 'center',
            }}
          />
        ))}
        {/* subtle ink frame lines inside the plate edge */}
        <div
          style={{
            position: 'absolute',
            inset: 14,
            border: `2px solid rgba(35,32,65,0.35)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
