import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Paper} from './Paper';
import {SceneRouter} from './templates';
import {SceneFade} from './templates/common';
import {Captions} from './components/Captions';
import {VideoProps} from './lib/types';
import {FPS} from './theme';

export const Main: React.FC<VideoProps> = (props) => {
  const {scenes, words, audio, total} = props;
  const totalFrames = Math.round(total * FPS);

  return (
    <AbsoluteFill>
      <Paper />
      {audio && <Audio src={staticFile(audio)} />}
      {scenes.map((scene, i) => {
        const from = Math.round(scene.start * FPS);
        const to = i < scenes.length - 1 ? Math.round(scenes[i + 1].start * FPS) : totalFrames;
        const dur = Math.max(1, to - from);
        const isLast = i === scenes.length - 1;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={dur} name={`${scene.id} (${scene.template})`}>
            <SceneFade hold={isLast}>
              <SceneRouter scene={scene} />
            </SceneFade>
          </Sequence>
        );
      })}
      {words?.length > 0 && <Captions words={words} />}
    </AbsoluteFill>
  );
};
