import React from 'react';
import {Scene} from '../lib/types';
import {Hook} from './Hook';
import {TitleCard} from './TitleCard';
import {ChapterCard} from './ChapterCard';
import {ParallaxStill} from './ParallaxStill';
import {Whiteboard} from './Whiteboard';
import {QuoteCard} from './QuoteCard';
import {EndScreen} from './EndScreen';

export const SceneRouter: React.FC<{scene: Scene}> = ({scene}) => {
  switch (scene.template) {
    case 'hook':
      return <Hook scene={scene} />;
    case 'title-card':
      return <TitleCard scene={scene} />;
    case 'chapter-card':
      return <ChapterCard scene={scene} />;
    case 'parallax-still':
      return <ParallaxStill scene={scene} />;
    case 'whiteboard':
      return <Whiteboard scene={scene} />;
    case 'quote-card':
      return <QuoteCard scene={scene} />;
    case 'end-screen':
      return <EndScreen scene={scene} />;
    default:
      return null;
  }
};
