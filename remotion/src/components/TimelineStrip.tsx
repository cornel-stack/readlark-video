import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DAYBREAK} from '../theme';
import {CAVEAT} from '../lib/fonts';

/** Volumes/episodes as a strip with a marker that advances to the active segment. */
export const TimelineStrip: React.FC<{
  segments: string[];
  marker: number;
  x?: number;
  y?: number;
  width?: number;
}> = ({segments, marker, x = 360, y = 980, width = 1200}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const step = width / segments.length;
  const grow = spring({frame, fps, config: {damping: 200}});
  const markerX = x + step * (marker + 0.5);
  const slide = interpolate(grow, [0, 1], [x + step * 0.5, markerX]);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <line x1={x} y1={y} x2={x + width} y2={y} stroke={DAYBREAK.ink} strokeOpacity={0.35} strokeWidth={3} />
        {segments.map((_, i) => (
          <circle key={i} cx={x + step * (i + 0.5)} cy={y} r={7} fill={i <= marker ? DAYBREAK.amber : 'rgba(35,32,65,0.3)'} />
        ))}
        <circle cx={slide} cy={y} r={15} fill={DAYBREAK.coral} />
      </svg>
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x + step * i,
            top: y + 18,
            width: step,
            textAlign: 'center',
            fontFamily: CAVEAT,
            fontSize: 34,
            color: i === marker ? DAYBREAK.coral : DAYBREAK.ink,
            opacity: i <= marker ? 1 : 0.5,
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
};
