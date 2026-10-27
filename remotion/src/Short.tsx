import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from './Paper';
import {ParallaxPlate} from './components/ParallaxPlate';
import {Handwriting} from './components/Handwriting';
import {TitleCard} from './templates/TitleCard';
import {SceneFade, plateLayers} from './templates/common';
import {VideoProps, Scene} from './lib/types';
import {buildShortPlan} from './lib/short';
import {wrapWords} from './lib/text';
import {CAVEAT} from './lib/fonts';
import {DAYBREAK, FPS} from './theme';

// Vertical hook: plate fills the frame, darkened, with the question centered.
const VHook: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const q = (scene.on_screen?.question as string) ?? '';
  const layers = plateLayers(scene);
  const plateIn = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: plateIn}}>
        {layers.length > 0 && <ParallaxPlate layers={layers} camera="push-in" framed={false} />}
      </div>
      <AbsoluteFill style={{backgroundColor: 'rgba(15,13,31,0.4)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{width: 940}}>
          <Handwriting lines={wrapWords(q, 16)} x={40} yTop={300} size={120} lineHeight={150} color={DAYBREAK.paper} startFrame={10} cps={11} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Vertical plate card with a handwritten label beneath.
const VPlate: React.FC<{scene: Scene}> = ({scene}) => {
  const ann = (scene.on_screen?.annotations as any[])?.[0];
  const label = (ann?.text as string) || (scene.on_screen?.caption as string) || '';
  const layers = plateLayers(scene);
  return (
    <Paper>
      {layers.length > 0 && <ParallaxPlate layers={layers} camera="drift" framed rect={{x: 80, y: 360, w: 920, h: 1040}} />}
      {label && (
        <div style={{position: 'absolute', inset: 0}}>
          <Handwriting lines={wrapWords(label, 20)} x={90} yTop={210} size={66} color={DAYBREAK.coral} startFrame={14} cps={13} />
        </div>
      )}
    </Paper>
  );
};

export const Short: React.FC<VideoProps> = (props) => {
  const {segments} = buildShortPlan(props, FPS);
  let cursor = 0;
  return (
    <AbsoluteFill>
      <Paper />
      {segments.map((seg, i) => {
        const from = cursor;
        cursor += seg.durFrames;
        const withAudio = seg.audioEnd > seg.audioStart;
        return (
          <Sequence key={i} from={from} durationInFrames={seg.durFrames} name={seg.scene.id}>
            {withAudio && (
              <Audio src={staticFile(props.audio)} startFrom={Math.round(seg.audioStart * FPS)} endAt={Math.round(seg.audioEnd * FPS)} />
            )}
            <SceneFade hold={i === segments.length - 1}>
              {seg.scene.template === 'hook' ? (
                <VHook scene={seg.scene} />
              ) : seg.scene.template === 'title-card' ? (
                <TitleCard scene={seg.scene} />
              ) : (
                <VPlate scene={seg.scene} />
              )}
            </SceneFade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
