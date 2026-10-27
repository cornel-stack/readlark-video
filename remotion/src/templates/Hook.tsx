import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Scene} from '../lib/types';
import {ParallaxPlate} from '../components/ParallaxPlate';
import {Handwriting} from '../components/Handwriting';
import {wrapWords} from '../lib/text';
import {DAYBREAK} from '../theme';
import {plateLayers} from './common';

export const Hook: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const question = (scene.on_screen?.question as string) ?? '';
  const lines = wrapWords(question, 20);
  const layers = plateLayers(scene);
  const plateIn = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: plateIn}}>
        {layers.length > 0 && <ParallaxPlate layers={layers} camera="push-in" framed={false} />}
      </div>
      {/* darken for legibility */}
      <AbsoluteFill style={{backgroundColor: 'rgba(15,13,31,0.34)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'relative', width: 1200, minHeight: lines.length * 150 + 80}}>
          <Handwriting
            lines={lines}
            x={60}
            yTop={150}
            size={128}
            lineHeight={150}
            color={DAYBREAK.paper}
            startFrame={14}
            cps={11}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
