import React from 'react';
import {Img, staticFile} from 'remotion';
import handData from '../../../assets/hand/cutouts/hand.json';

type Variant = 'write' | 'point' | 'rest';

const DATA = handData as unknown as {
  variants: Record<Variant, {file: string; w: number; h: number; tip: number[]}>;
};

// Display height of the hand on a 1080p frame; scale tunes per use.
const BASE_H = 560;

/**
 * Renders a hand cutout so its pen nib sits exactly on (x, y). `down` is 1 when the
 * nib touches the surface and 0 when lifted (the hand rises and fades between items,
 * per the brief). Nib offsets come from hand.json (calibrated in tools/hand_cutout).
 */
export const Hand: React.FC<{
  x: number;
  y: number;
  variant?: Variant;
  scale?: number;
  down?: number;
  rotate?: number;
}> = ({x, y, variant = 'write', scale = 1, down = 1, rotate = 0}) => {
  const v = DATA.variants[variant];
  const h = BASE_H * scale;
  const w = (v.w / v.h) * h;
  const nibX = v.tip[0] * w;
  const nibY = v.tip[1] * h;
  const lift = (1 - down) * 46; // px the hand rises when lifted

  return (
    <Img
      src={staticFile('hand/cutouts/' + v.file)}
      style={{
        position: 'absolute',
        width: w,
        height: h,
        left: x - nibX,
        top: y - nibY - lift,
        transformOrigin: `${nibX}px ${nibY}px`,
        transform: `rotate(${rotate}deg)`,
        opacity: 0.5 + 0.5 * down,
        filter: 'drop-shadow(6px 10px 10px rgba(15,13,31,0.22))',
        pointerEvents: 'none',
      }}
    />
  );
};
