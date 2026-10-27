import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from '../Paper';
import {Scene, Annotation} from '../lib/types';
import {ParallaxPlate} from '../components/ParallaxPlate';
import {Handwriting} from '../components/Handwriting';
import {cameraFor} from '../lib/seed';
import {CAVEAT} from '../lib/fonts';
import {DAYBREAK, WIDTH, HEIGHT} from '../theme';
import {plateLayers} from './common';

const RECT = {x: 300, y: 96, w: 1320, h: 820};

export const ParallaxStill: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const layers = plateLayers(scene);
  const camera = cameraFor(scene);
  const caption = scene.on_screen?.caption as string | undefined;
  const annotations = (scene.on_screen?.annotations as Annotation[] | undefined) ?? [];
  const capIn = interpolate(frame, [20, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Paper>
      {layers.length > 0 && <ParallaxPlate layers={layers} camera={camera} framed rect={RECT} />}

      {annotations.map((a, i) => {
        if (a.kind === 'label') {
          const ax = (a.at?.[0] ?? 0.2) * WIDTH;
          const ay = (a.at?.[1] ?? 0.75) * HEIGHT;
          return (
            <div key={i} style={{position: 'absolute', inset: 0}}>
              <Handwriting lines={[a.text]} x={ax} yTop={ay} size={58} color={DAYBREAK.coral} startFrame={fps * 1 + i * fps * 1.5} cps={13} />
            </div>
          );
        }
        return null;
      })}

      {caption && (
        <div
          style={{
            position: 'absolute',
            left: RECT.x,
            top: RECT.y + RECT.h + 26,
            width: RECT.w,
            textAlign: 'center',
            fontFamily: CAVEAT,
            fontSize: 42,
            color: DAYBREAK.ink,
            opacity: capIn * 0.85,
          }}
        >
          {caption}
        </div>
      )}
    </Paper>
  );
};
