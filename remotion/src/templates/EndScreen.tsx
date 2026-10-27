import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Paper} from '../Paper';
import {Scene} from '../lib/types';
import {CAVEAT} from '../lib/fonts';
import {DAYBREAK} from '../theme';

export const EndScreen: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const os = scene.on_screen ?? {};
  const message = (os.message as string) ?? 'Watch next';
  const pointsTo = (os.points_to as string) ?? '';
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});

  // Two YouTube end-screen slots: left = next video, right = subscribe.
  const Slot: React.FC<{x: number; label: string; sub: string}> = ({x, label, sub}) => (
    <div style={{position: 'absolute', left: x, top: 360, width: 560, height: 316, border: `3px dashed ${DAYBREAK.ink}`, borderRadius: 18, background: 'rgba(244,96,62,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: CAVEAT, fontSize: 56, color: DAYBREAK.ink}}>{label}</div>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: DAYBREAK.ink, opacity: 0.6, marginTop: 10}}>{sub}</div>
    </div>
  );

  return (
    <Paper>
      <AbsoluteFill style={{opacity: fadeIn}}>
        <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 84, color: DAYBREAK.ink}}>
          {message}
        </div>
        <Slot x={300} label={pointsTo ? `▶  ${pointsTo}` : '▶  Next'} sub="the companion video" />
        <Slot x={1060} label="Subscribe" sub="new book videos weekly" />
        <div style={{position: 'absolute', bottom: 90, width: '100%', textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: DAYBREAK.ink}}>
          Read<span style={{color: DAYBREAK.coral}}>Lark</span>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
