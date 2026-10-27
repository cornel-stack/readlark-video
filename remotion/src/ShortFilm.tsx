import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DarkPlate} from './shorts/DarkPlate';
import {KineticText} from './shorts/KineticText';
import {NIGHT, SERIF, FPS} from './theme';

export type ShortBeat = {text: string; start: number; end: number; plate?: string; emphasis?: boolean};
export type ShortProps = {
  id: string;
  topic: string;
  thinker: string;
  thinker_dates?: string;
  title: string;
  audio: string;
  total: number;
  beats: ShortBeat[];
  plates: Record<string, string>;
  attribution: string;
  cta: string;
};

const EMPTY: ShortProps = {
  id: '', topic: '', thinker: '', title: '', audio: '', total: 1, beats: [], plates: {}, attribution: '', cta: 'Follow for more',
};

export const ShortFilm: React.FC<ShortProps> = (props = EMPTY) => {
  const {beats, plates, audio, total, thinker, thinker_dates, cta} = props;
  const totalFrames = Math.round(total * FPS);
  const frame = useCurrentFrame();

  // effective plate per beat (carry the last one set)
  let last = '';
  const eff = beats.map((b) => (last = b.plate || last));

  // merge consecutive beats sharing a plate into continuous plate spans
  const spans: {src: string; from: number; to: number; i: number}[] = [];
  beats.forEach((b, i) => {
    const from = Math.round(b.start * FPS);
    const to = i < beats.length - 1 ? Math.round(beats[i + 1].start * FPS) : totalFrames;
    const src = plates[eff[i]] || '';
    const prev = spans[spans.length - 1];
    if (prev && prev.src === src) prev.to = to;
    else spans.push({src, from, to, i});
  });

  const ctaIn = interpolate(frame, [totalFrames - 72, totalFrames - 54], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: NIGHT.bg}}>
      {audio && <Audio src={staticFile(audio)} />}

      {spans.map((s, k) => (
        <Sequence key={k} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} name={`plate ${k}`}>
          {s.src ? <DarkPlate src={s.src} seed={s.i} /> : <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${NIGHT.bg2}, ${NIGHT.bg})`}} />}
        </Sequence>
      ))}

      {beats.map((b, i) => {
        const from = Math.round(b.start * FPS);
        const to = i < beats.length - 1 ? Math.round(beats[i + 1].start * FPS) : totalFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={`beat ${i}`}>
            <KineticText text={b.text} localDur={to - from} emphasis={b.emphasis} />
          </Sequence>
        );
      })}

      {/* persistent attribution + ReadLark thread */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: NIGHT.dim}}>
          {thinker}{thinker_dates ? `  ·  ${thinker_dates}` : ''}
        </div>
        <div style={{margin: '14px auto 0', width: 90, height: 3, background: NIGHT.coral, borderRadius: 2}} />
      </div>

      {/* final call-to-action */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 78, textAlign: 'center', opacity: ctaIn}}>
        <span style={{fontFamily: SERIF, fontSize: 40, color: NIGHT.bone}}>{cta}</span>
        <span style={{fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, color: NIGHT.bone, marginLeft: 16}}>
          Read<span style={{color: NIGHT.coral}}>Lark</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
