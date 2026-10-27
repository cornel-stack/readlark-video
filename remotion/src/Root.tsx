import React from 'react';
import {Composition} from 'remotion';
import {Placeholder} from './Placeholder';
import {HandSample} from './HandSample';
import {Main} from './Main';
import {Short} from './Short';
import {Thumbnail} from './Thumbnail';
import {ShortFilm, ShortProps} from './ShortFilm';
import {VideoProps} from './lib/types';
import {buildShortPlan} from './lib/short';
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
      <Composition
        id="Short"
        component={Short}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={EMPTY}
        calculateMetadata={({props}) => ({
          durationInFrames: Math.max(1, buildShortPlan(props, FPS).totalFrames),
        })}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{...EMPTY, variant: 0}}
      />
      <Composition
        id="ShortFilm"
        component={ShortFilm}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{id: '', topic: '', thinker: '', title: '', audio: '', total: 1, beats: [], plates: {}, attribution: '', cta: 'Follow for more'} as ShortProps}
        calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.round((props.total ?? 1) * FPS))})}
      />
      <Composition id="Placeholder" component={Placeholder} durationInFrames={10 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="HandSample" component={HandSample} durationInFrames={20 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
