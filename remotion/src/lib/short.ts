import {VideoProps, Scene} from './types';

export type ShortSegment = {scene: Scene; durFrames: number; audioStart: number; audioEnd: number};

const MAX_SCENE_S = 22;
const TITLE_S = 4.5;

/**
 * Plan a 45–60s vertical teaser: the hook, the single best plate+annotation scene,
 * ending on the title card. Audio is sliced from the main narration.wav. Pure, so
 * calculateMetadata and the component agree on duration.
 */
export function buildShortPlan(props: VideoProps, fps: number): {segments: ShortSegment[]; totalFrames: number} {
  const scenes = props.scenes ?? [];
  if (!scenes.length) return {segments: [], totalFrames: Math.round(10 * fps)};

  const hook = scenes.find((s) => s.template === 'hook') ?? scenes[0];
  const annotated = scenes.find(
    (s) => s.template === 'parallax-still' && Array.isArray((s.on_screen as any)?.annotations) && (s.on_screen as any).annotations.length
  );
  const best = annotated ?? scenes.find((s) => s.template === 'parallax-still') ?? scenes[1] ?? hook;
  const title = scenes.find((s) => s.template === 'title-card');

  const segs: ShortSegment[] = [];
  const add = (scene: Scene, maxS: number) => {
    const dur = Math.min(maxS, Math.max(2, scene.end - scene.start));
    segs.push({scene, durFrames: Math.round(dur * fps), audioStart: scene.start, audioEnd: scene.start + dur});
  };
  add(hook, MAX_SCENE_S);
  add(best, MAX_SCENE_S);
  if (title) segs.push({scene: title, durFrames: Math.round(TITLE_S * fps), audioStart: title.start, audioEnd: title.start});

  const totalFrames = segs.reduce((n, s) => n + s.durFrames, 0);
  return {segments: segs, totalFrames};
}
