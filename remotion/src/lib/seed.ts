// Deterministic choices from a scene id — so "auto" camera moves and jitter are
// reproducible across machines and CI (no Math.random / Date).

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(id: string, options: T[]): T {
  return options[hashStr(id) % options.length];
}

export type Camera = 'push-in' | 'drift' | 'pan' | 'reveal';
export const CAMERAS: Camera[] = ['push-in', 'drift', 'pan', 'reveal'];

export function cameraFor(scene: {id: string; on_screen?: Record<string, unknown>}): Camera {
  const req = scene.on_screen?.camera as Camera | 'auto' | undefined;
  if (req && req !== 'auto') return req;
  return pick(scene.id, CAMERAS);
}
