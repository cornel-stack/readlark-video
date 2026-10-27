import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Layer} from '../components/ParallaxPlate';
import {Scene} from '../lib/types';

/** Layer[] for a scene's plate, falling back to a single flat base if needed. */
export function plateLayers(scene: Scene): Layer[] {
  // build_props always supplies plateLayers (incl. a single base layer for flat
  // plates), so this is just a safety net: show nothing rather than a wrong-book image.
  return scene.plateLayers?.layers ?? [];
}

/** Gentle scene-level fade in/out so cuts read as soft dissolves. */
export const SceneFade: React.FC<{children: React.ReactNode; hold?: boolean}> = ({children, hold}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = hold
    ? 1
    : interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return <div style={{position: 'absolute', inset: 0, opacity: Math.min(fadeIn, fadeOut)}}>{children}</div>;
};
