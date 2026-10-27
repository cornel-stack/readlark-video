import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {DAYBREAK} from '../theme';

export type Word = {word: string; start: number; end: number};
type Cue = {start: number; end: number; lines: string[]};

const MAX_LINE = 42;

function wrap(words: Word[]): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const tok = w.word.trim();
    if ((cur + ' ' + tok).trim().length > MAX_LINE) {
      lines.push(cur);
      cur = tok;
      if (lines.length === 2) break;
    } else {
      cur = (cur + ' ' + tok).trim();
    }
  }
  if (cur && lines.length < 2) lines.push(cur);
  return lines.slice(0, 2);
}

export function buildCues(words: Word[]): Cue[] {
  const cues: Cue[] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const txt = w.word.trim();
    const dur = cur[cur.length - 1].end - cur[0].start;
    if (/[.!?…]$/.test(txt) || cur.length >= 9 || dur > 3.6) {
      cues.push({start: cur[0].start, end: cur[cur.length - 1].end, lines: wrap(cur)});
      cur = [];
    }
  }
  if (cur.length) cues.push({start: cur[0].start, end: cur[cur.length - 1].end, lines: wrap(cur)});
  return cues;
}

export const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cues = React.useMemo(() => buildCues(words), [words]);
  const cue = cues.find((c) => t >= c.start && t <= c.end + 0.15);
  if (!cue) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 70,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          textAlign: 'center',
          backgroundColor: 'rgba(250,245,235,0.86)',
          border: `2px solid ${DAYBREAK.ink}`,
          borderRadius: 10,
          padding: '12px 26px',
          fontFamily: 'Georgia, serif',
          fontSize: 40,
          lineHeight: 1.25,
          color: DAYBREAK.ink,
          boxShadow: '0 8px 22px rgba(15,13,31,0.18)',
        }}
      >
        {cue.lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};
