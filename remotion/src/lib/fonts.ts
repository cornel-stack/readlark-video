// Handwriting font (Caveat, OFL) loaded through Remotion's google-fonts helper so
// it is embedded in the render and available in the headless browser. Approximate
// per-character width table (em fractions) lets us place the hand at the writing
// frontier without DOM text measurement, keeping renders deterministic.
import {loadFont} from '@remotion/google-fonts/Caveat';

export const {fontFamily: CAVEAT} = loadFont();

// Caveat is fairly uniform; these are good-enough advance widths as a fraction of
// font size for placing the nib. Default covers the common case.
const W: Record<string, number> = {
  ' ': 0.26, i: 0.2, l: 0.2, j: 0.22, t: 0.26, f: 0.26, r: 0.3, '!': 0.2,
  m: 0.62, w: 0.62, M: 0.66, W: 0.66, default: 0.42,
};

export function textWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) w += (W[ch] ?? W.default) * fontSize;
  return w;
}
