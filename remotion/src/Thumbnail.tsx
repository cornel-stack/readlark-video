import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {VideoProps} from './lib/types';
import {CAVEAT} from './lib/fonts';
import {DAYBREAK} from './theme';

export type ThumbConfig = {plate: string; headline: string; sub?: string; accent?: string};

type Props = VideoProps & {variant?: number; thumbnails?: ThumbConfig[]};

/**
 * 1280×720 thumbnail still, driven by props.thumbnails[variant] (built in
 * build_props.py from the book + plates — no per-video React). 3–5 words of hand
 * lettering over a plate, Daybreak-styled.
 */
export const Thumbnail: React.FC<Props> = (props) => {
  const variant = props.variant ?? 0;
  const cfg: ThumbConfig =
    props.thumbnails?.[variant] ?? {plate: `art/${props.code.replace(/[AB]$/, '')}/${(props.scenes?.[0]?.assets?.[0]) ?? ''}.jpg`, headline: String(props.meta?.book ?? '')};
  const accent = cfg.accent ?? DAYBREAK.coral;

  return (
    <AbsoluteFill style={{backgroundColor: DAYBREAK.paper}}>
      {cfg.plate && (
        <Img src={staticFile(cfg.plate)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      )}
      {/* left ink gradient for text legibility */}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(15,13,31,0.72) 0%, rgba(15,13,31,0.5) 42%, rgba(15,13,31,0.05) 75%)'}} />
      <div style={{position: 'absolute', left: 60, top: 70, bottom: 70, right: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div
          style={{
            fontFamily: CAVEAT,
            fontWeight: 700,
            fontSize: cfg.headline.length > 18 ? 118 : 150,
            lineHeight: 0.98,
            color: DAYBREAK.paper,
            textShadow: '0 6px 18px rgba(0,0,0,0.55)',
          }}
        >
          {cfg.headline}
        </div>
        {cfg.sub && (
          <div style={{marginTop: 20, display: 'inline-block'}}>
            <span style={{fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 52, color: DAYBREAK.ink, background: accent, padding: '6px 22px', borderRadius: 8}}>
              {cfg.sub}
            </span>
          </div>
        )}
      </div>
      <div style={{position: 'absolute', right: 40, bottom: 34, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 46, color: DAYBREAK.paper, textShadow: '0 4px 12px rgba(0,0,0,0.6)'}}>
        Read<span style={{color: DAYBREAK.amber}}>Lark</span>
      </div>
    </AbsoluteFill>
  );
};
