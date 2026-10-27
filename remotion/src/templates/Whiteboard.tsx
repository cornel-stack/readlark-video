import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from '../Paper';
import {Scene, Annotation} from '../lib/types';
import {Handwriting} from '../components/Handwriting';
import {DrawnStroke} from '../components/DrawnStroke';
import {CAVEAT, textWidth} from '../lib/fonts';
import {DAYBREAK} from '../theme';

const NODE_POS: [number, number][] = [
  [580, 520], [1360, 520], [360, 270], [1000, 235], [1560, 270], [1560, 800], [1000, 865], [360, 800],
];

const CharacterMap: React.FC<{a: Extract<Annotation, {kind: 'character-map'}>; start: number}> = ({a, start}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pos: Record<string, [number, number]> = {};
  a.nodes.forEach((n, i) => {
    pos[n.id] = n.at ? [n.at[0] * 1920, n.at[1] * 1080] : NODE_POS[i % NODE_POS.length];
  });
  const nodeStagger = 10;
  const edgeStart = start + a.nodes.length * nodeStagger + 6;

  return (
    <>
      {/* edges first in z-order (under nodes), revealed after nodes appear */}
      {(a.edges ?? []).map((e, i) => {
        const p0 = pos[e.from];
        const p1 = pos[e.to];
        if (!p0 || !p1) return null;
        const mid: [number, number] = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 40];
        return (
          <DrawnStroke
            key={i}
            points={[{x: p0[0], y: p0[1]}, {x: mid[0], y: mid[1]}, {x: p1[0], y: p1[1]}]}
            startFrame={edgeStart + i * 14}
            durFrames={14}
            arrow
            color={DAYBREAK.coral}
            width={4}
            showHand={false}
          />
        );
      })}
      {(a.edges ?? []).map((e, i) => {
        const p0 = pos[e.from];
        const p1 = pos[e.to];
        if (!p0 || !p1 || !e.label) return null;
        const vis = interpolate(frame, [edgeStart + i * 14 + 8, edgeStart + i * 14 + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={'l' + i} style={{position: 'absolute', left: (p0[0] + p1[0]) / 2 - 150, top: (p0[1] + p1[1]) / 2 - 64, width: 300, textAlign: 'center', fontFamily: CAVEAT, fontSize: 28, color: DAYBREAK.ink, opacity: vis}}>
            {e.label}
          </div>
        );
      })}
      {a.nodes.map((n, i) => {
        const [x, y] = pos[n.id];
        const w = Math.max(160, textWidth(n.label, 40) + 60);
        const pop = spring({frame: frame - (start + i * nodeStagger), fps, config: {damping: 180}});
        return (
          <div key={n.id} style={{position: 'absolute', left: x - w / 2, top: y - 44, width: w, height: 88, transform: `scale(${pop})`, opacity: pop, background: DAYBREAK.paper, border: `3px solid ${DAYBREAK.ink}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(15,13,31,0.15)'}}>
            <span style={{fontFamily: CAVEAT, fontSize: 40, color: DAYBREAK.ink}}>{n.label}</span>
          </div>
        );
      })}
    </>
  );
};

const ThemeList: React.FC<{a: Extract<Annotation, {kind: 'theme-list'}>; start: number; perItem: number}> = ({a, start, perItem}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {a.items.map((item, i) => {
        const sf = start + i * perItem;
        const dashIn = interpolate(frame, [sf - 4, sf + 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const y = 360 + i * 116;
        return (
          <div key={i} style={{position: 'absolute', inset: 0}}>
            <div style={{position: 'absolute', left: 230, top: y - 6, width: 54, height: 10, background: DAYBREAK.amber, borderRadius: 6, opacity: dashIn}} />
            <Handwriting lines={[item]} x={320} yTop={y + 18} size={64} color={DAYBREAK.ink} startFrame={sf} cps={16} handVariant="write" />
          </div>
        );
      })}
    </>
  );
};

export const Whiteboard: React.FC<{scene: Scene}> = ({scene}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const os = scene.on_screen ?? {};
  const heading = os.heading as string | undefined;
  const annotations = (os.annotations as Annotation[]) ?? [];
  const headStart = 2;
  const bodyStart = heading ? 30 : 6;

  return (
    <Paper>
      {heading && (
        <div style={{position: 'absolute', inset: 0}}>
          <div style={{position: 'absolute', left: 230, top: 150, width: 120, height: 10, background: DAYBREAK.coral, borderRadius: 6}} />
          <Handwriting lines={[heading]} x={230} yTop={240} size={80} color={DAYBREAK.ink} startFrame={headStart} cps={16} />
        </div>
      )}
      {annotations.map((a, i) => {
        if (a.kind === 'character-map') return <CharacterMap key={i} a={a} start={bodyStart} />;
        if (a.kind === 'theme-list') {
          const perItem = Math.max(20, Math.floor((durationInFrames - bodyStart - fps) / a.items.length));
          return <ThemeList key={i} a={a} start={bodyStart} perItem={Math.min(perItem, 46)} />;
        }
        return null;
      })}
    </Paper>
  );
};
