import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Hand} from './Hand';
import {samplePath, drawnPath, pointAt, arrowHead, Pt} from '../lib/stroke';
import {DAYBREAK} from '../theme';

/** A single stroke (line / curve / circle) drawn progressively by the hand. */
export const DrawnStroke: React.FC<{
  points: Pt[];
  startFrame: number;
  durFrames: number;
  color?: string;
  width?: number;
  arrow?: boolean;
  showHand?: boolean;
}> = ({points, startFrame, durFrames, color = DAYBREAK.coral, width = 6, arrow = false, showHand = true}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const samples = React.useMemo(() => samplePath(points), [points]);
  const p = interpolate(frame, [startFrame, startFrame + durFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0) return null;
  const d = drawnPath(samples, p);
  const nib = pointAt(samples, p);
  const headFrac = interpolate(p, [0.82, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const heads = arrow ? arrowHead(pointAt(samples, 1), pointAt(samples, 0.9), 28) : [];
  const drawing = p > 0 && p < 1 && frame < durationInFrames - 4;

  return (
    <>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        {arrow &&
          headFrac > 0 &&
          heads.map((seg, i) => (
            <line
              key={i}
              x1={seg[0].x}
              y1={seg[0].y}
              x2={seg[0].x + (seg[1].x - seg[0].x) * headFrac}
              y2={seg[0].y + (seg[1].y - seg[0].y) * headFrac}
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
            />
          ))}
      </svg>
      {showHand && drawing && <Hand x={nib.x} y={nib.y} variant="write" down={1} scale={0.82} />}
    </>
  );
};
