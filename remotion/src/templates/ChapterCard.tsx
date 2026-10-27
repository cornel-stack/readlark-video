import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Paper} from '../Paper';
import {Scene} from '../lib/types';
import {TimelineStrip} from '../components/TimelineStrip';
import {Handwriting} from '../components/Handwriting';
import {wrapWords} from '../lib/text';
import {DAYBREAK} from '../theme';

export const ChapterCard: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const os = scene.on_screen ?? {};
  const title = (os.chapter_title as string) ?? '';
  const tl = os.timeline as {segments: string[]; marker?: number} | undefined;
  const lines = wrapWords(title, 22);
  const barIn = interpolate(frame, [6, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Paper>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'flex-start'}}>
        <div style={{position: 'absolute', left: 160, top: 320, opacity: barIn}}>
          <div style={{width: 90, height: 10, background: DAYBREAK.amber, borderRadius: 6, marginBottom: 30}} />
        </div>
        <div style={{position: 'relative', width: 1500, marginLeft: 160}}>
          <Handwriting lines={lines} x={0} yTop={430} size={110} lineHeight={128} color={DAYBREAK.ink} startFrame={6} cps={14} />
        </div>
      </AbsoluteFill>
      {tl && <TimelineStrip segments={tl.segments} marker={tl.marker ?? 0} />}
    </Paper>
  );
};
