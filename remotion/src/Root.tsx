import React from 'react';
import {Composition} from 'remotion';
import {Placeholder} from './Placeholder';
import {HandSample} from './HandSample';
import {Main} from './Main';
import {VideoProps} from './lib/types';
import {FPS, HEIGHT, WIDTH} from './theme';

const EMPTY: VideoProps = {
  code: 'CL-11A',
  meta: {code: 'CL-11A', book: '', author: '', year: '', title: '', format: ''},
  chapters: [],
  scenes: [],
  words: [],
  audio: '',
  total: 1,
};

/**
 * Composition registry. Main is data-driven: its props (script scenes merged with
 * audio timing + depth layers) are passed at render time via --props, and
 * calculateMetadata derives the duration from the narration length.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={EMPTY}
        calculateMetadata={({props}) => ({
          durationInFrames: Math.max(1, Math.round((props.total ?? 1) * FPS)),
        })}
      />
      <Composition id="Placeholder" component={Placeholder} durationInFrames={10 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="HandSample" component={HandSample} durationInFrames={20 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
