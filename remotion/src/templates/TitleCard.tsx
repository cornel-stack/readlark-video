import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from '../Paper';
import {Scene} from '../lib/types';
import {DAYBREAK} from '../theme';

export const TitleCard: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const os = scene.on_screen ?? {};
  const title = (os.title as string) ?? '';
  const subtitle = os.subtitle as string | undefined;
  const author = (os.author as string) ?? '';
  const year = os.year as string | number | undefined;

  const rise = spring({frame, fps, config: {damping: 200}});
  const underline = interpolate(frame, [18, 48], [0, 760], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sub = interpolate(frame, [20, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const brand = interpolate(frame, [40, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Paper>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{textAlign: 'center', opacity: rise, transform: `translateY(${(1 - rise) * 24}px)`}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 150, fontWeight: 700, color: DAYBREAK.ink, letterSpacing: 1}}>
            {title}
          </div>
          <svg width="900" height="34" style={{marginTop: 4}}>
            <line x1={(900 - 760) / 2} y1={18} x2={(900 - 760) / 2 + underline} y2={18} stroke={DAYBREAK.coral} strokeWidth={8} strokeLinecap="round" />
          </svg>
          {subtitle && (
            <div style={{fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 46, color: DAYBREAK.ink, opacity: sub * 0.8, marginTop: 10}}>
              {subtitle}
            </div>
          )}
          <div style={{fontFamily: 'Georgia, serif', fontSize: 50, color: DAYBREAK.ink, opacity: sub, marginTop: 26}}>
            {author}{year ? ` · ${year}` : ''}
          </div>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, opacity: brand, marginTop: 40, color: DAYBREAK.ink}}>
            Read<span style={{color: DAYBREAK.coral}}>Lark</span>
          </div>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
