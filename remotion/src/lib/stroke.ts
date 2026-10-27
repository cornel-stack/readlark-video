// Deterministic stroke geometry for the hand-drawn engine.
// We sample any stroke (polyline or quadratic bézier) into points with cumulative
// arc length, entirely in JS — no DOM measurement — so renders are reproducible on
// any machine / CI. A stroke is revealed by drawing the sub-path up to
// progress*totalLength, and the hand's nib is placed at that same point.

export type Pt = {x: number; y: number};
export type Sample = {x: number; y: number; len: number};

function quad(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Sample a polyline (2+ points). With exactly 3 points, treats the middle as a
 *  quadratic control point for a gentle curve. */
export function samplePath(points: Pt[], steps = 160): Sample[] {
  const pts: Pt[] =
    points.length === 3
      ? Array.from({length: steps + 1}, (_, i) => quad(points[0], points[1], points[2], i / steps))
      : points;
  const out: Sample[] = [{x: pts[0].x, y: pts[0].y, len: 0}];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    out.push({x: pts[i].x, y: pts[i].y, len: out[i - 1].len + Math.hypot(dx, dy)});
  }
  return out;
}

export function totalLength(s: Sample[]): number {
  return s[s.length - 1].len;
}

/** Point at a fraction (0..1) of total arc length. */
export function pointAt(s: Sample[], frac: number): Pt {
  const target = frac * totalLength(s);
  for (let i = 1; i < s.length; i++) {
    if (s[i].len >= target) {
      const seg = s[i].len - s[i - 1].len || 1;
      const t = (target - s[i - 1].len) / seg;
      return {x: s[i - 1].x + (s[i].x - s[i - 1].x) * t, y: s[i - 1].y + (s[i].y - s[i - 1].y) * t};
    }
  }
  return {x: s[s.length - 1].x, y: s[s.length - 1].y};
}

/** SVG path `d` for the portion of the stroke drawn so far (0..frac). */
export function drawnPath(s: Sample[], frac: number): string {
  const end = pointAt(s, frac);
  const target = frac * totalLength(s);
  let d = `M ${s[0].x} ${s[0].y}`;
  for (let i = 1; i < s.length; i++) {
    if (s[i].len >= target) break;
    d += ` L ${s[i].x} ${s[i].y}`;
  }
  d += ` L ${end.x} ${end.y}`;
  return d;
}

/** Circle/ellipse as a closed polyline (for the 'circle' annotation). */
export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, steps = 120): Pt[] {
  // start at top, go clockwise, slightly overshoot so it reads as hand-drawn
  const pts: Pt[] = [];
  const total = 1.06;
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + total * 2 * Math.PI * (i / steps);
    pts.push({x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a)});
  }
  return pts;
}

/** Arrowhead strokes (two short lines) at the end of a stroke pointing along dir. */
export function arrowHead(tip: Pt, from: Pt, size = 26): Pt[][] {
  const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
  const a1 = ang + Math.PI * 0.82;
  const a2 = ang - Math.PI * 0.82;
  return [
    [tip, {x: tip.x + size * Math.cos(a1), y: tip.y + size * Math.sin(a1)}],
    [tip, {x: tip.x + size * Math.cos(a2), y: tip.y + size * Math.sin(a2)}],
  ];
}
