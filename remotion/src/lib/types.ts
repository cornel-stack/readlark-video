import {Layer} from '../components/ParallaxPlate';
import {Word} from '../components/Captions';

export type Annotation =
  | {kind: 'label'; text: string; at?: [number, number]}
  | {kind: 'underline'; target?: string; at?: [number, number]}
  | {kind: 'circle'; target?: string; at?: [number, number]}
  | {kind: 'arrow'; from?: [number, number]; to?: [number, number]; label?: string}
  | {kind: 'character-map'; nodes: {id: string; label: string; at?: [number, number]}[]; edges?: {from: string; to: string; label?: string}[]}
  | {kind: 'theme-list'; items: string[]}
  | {kind: 'quote-reveal'; lines: string[]; source: string}
  | {kind: 'timeline-strip'; segments: string[]; marker?: number};

export type Scene = {
  id: string;
  template: 'hook' | 'title-card' | 'chapter-card' | 'parallax-still' | 'whiteboard' | 'quote-card' | 'end-screen';
  narration: string;
  duration_hint?: number;
  on_screen?: Record<string, unknown>;
  assets?: string[];
  notes?: string;
  // injected by build_props.py:
  start: number;
  end: number;
  plateLayers?: {flat: boolean; layers: Layer[]};
};

export type VideoProps = {
  code: string;
  meta: {
    code: string;
    book: string;
    author: string;
    year: number | string;
    title: string;
    format: string;
  };
  chapters: {title: string; first_scene: string}[];
  scenes: Scene[];
  words: Word[];
  audio: string; // staticFile path to narration.wav
  total: number; // seconds
};
