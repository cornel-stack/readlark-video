import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from '../Paper';
import {Scene} from '../lib/types';
import {Handwriting} from '../components/Handwriting';
import {wrapWords} from '../lib/text';
import {CAVEAT} from '../lib/fonts';
import {DAYBREAK} from '../theme';

export const QuoteCard: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const os = scene.on_screen ?? {};
  const quote = (os.quote as string) ?? '';
  const source = (os.source as string) ?? '';
  const lines = wrapWords(quote, 30);
  const size = lines.length > 4 ? 72 : 90;
  const lh = size * 1.18;
  const totalChars = quote.length;
  const writeDone = frame / fps > totalChars / 15 + 1;
  const srcIn = interpolate(frame, [fps * (totalChars / 15 + 0.6), fps * (totalChars / 15 + 1.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yTop = 540 - (lines.length * lh) / 2;

  return (
    <Paper>
      {/* large opening quotation mark */}
      <div style={{position: 'absolute', left: 150, top: yTop - 150, fontFamily: 'Georgia, serif', fontSize: 280, color: DAYBREAK.coral, opacity: 0.25}}>“</div>
      <AbsoluteFill>
        <Handwriting lines={lines} x={230} yTop={yTop} size={size} lineHeight={lh} color={DAYBREAK.ink} startFrame={8} cps={15} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          right: 240,
          top: yTop + lines.length * lh + 40,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 40,
          color: DAYBREAK.ink,
          opacity: srcIn * 0.75,
        }}
      >
        — {source}
      </div>
    </Paper>
  );
};
