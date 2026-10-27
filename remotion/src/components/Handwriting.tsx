import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Hand} from './Hand';
import {CAVEAT, textWidth} from '../lib/fonts';
import {DAYBREAK} from '../theme';

/**
 * Text written by the hand, character by character, the nib tracking the writing
 * frontier and lifting between lines. Absolute-frame driven so it composes inside
 * any Sequence. Multi-line: pass lines[]; they are written top-to-bottom in order.
 */
export const Handwriting: React.FC<{
  lines: string[];
  x: number;
  yTop: number; // baseline of the first line
  size: number;
  lineHeight?: number;
  color?: string;
  startFrame?: number;
  cps?: number; // characters per second
  showHand?: boolean;
  handVariant?: 'write' | 'point';
  weight?: number;
  font?: string;
}> = ({
  lines,
  x,
  yTop,
  size,
  lineHeight,
  color = DAYBREAK.ink,
  startFrame = 0,
  cps = 13,
  showHand = true,
  handVariant = 'write',
  weight = 400,
  font = CAVEAT,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lh = lineHeight ?? size * 1.15;

  const elapsed = Math.max(0, (frame - startFrame) / fps);
  let written = Math.floor(elapsed * cps);
  const total = lines.reduce((n, l) => n + l.length, 0);
  const done = written >= total;

  // Figure out which line the nib is on and how far along.
  let nibX = x;
  let nibY = yTop;
  let activeLine = -1;
  let cum = 0;
  const rendered: {text: string; y: number}[] = [];
  for (let i = 0; i < lines.length; i++) {
    const take = Math.max(0, Math.min(lines[i].length, written - cum));
    const vis = lines[i].slice(0, take);
    rendered.push({text: vis, y: yTop + i * lh});
    if (take > 0 && take < lines[i].length && activeLine === -1) {
      activeLine = i;
      nibX = x + textWidth(vis, size);
      nibY = yTop + i * lh;
    }
    cum += lines[i].length;
  }
  if (activeLine === -1 && !done) {
    // between lines / at start
    const li = Math.min(lines.length - 1, rendered.findIndex((r) => r.text.length === 0));
    nibY = yTop + (li < 0 ? 0 : li) * lh;
  }
  if (done) {
    const last = lines.length - 1;
    nibX = x + textWidth(lines[last], size);
    nibY = yTop + last * lh;
  }

  const handDown = showHand && written > 0 && !done ? 1 : 0;

  return (
    <>
      {rendered.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: r.y,
            transform: 'translateY(-0.8em)',
            fontFamily: font,
            fontSize: size,
            fontWeight: weight,
            color,
            whiteSpace: 'pre',
            lineHeight: 1,
          }}
        >
          {r.text}
        </div>
      ))}
      {showHand && handDown > 0 && <Hand x={nibX} y={nibY} variant={handVariant} down={handDown} scale={0.86} />}
    </>
  );
};
