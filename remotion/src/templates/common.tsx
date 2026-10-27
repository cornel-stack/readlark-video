import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Layer} from '../components/ParallaxPlate';
import {Scene} from '../lib/types';

/** Layer[] for a scene's plate, falling back to a single flat base if needed. */
export function plateLayers(scene: Scene): Layer[] {
  if (scene.plateLayers?.layers?.length) return scene.plateLayers.layers;
  const plate = (scene.on_screen?.plate as string) || scene.assets?.[0];
  return plate ? [{file: `art/CL-11/${plate}.jpg`, parallax: 0}] : [];
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
