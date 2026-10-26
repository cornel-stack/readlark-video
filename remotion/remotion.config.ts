import {Config} from '@remotion/cli/config';

// Deterministic, free, open-source render settings. H.264 + AAC is set at the
// package step via FFmpeg; here we keep the defaults sane for local previews.
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null); // let Remotion pick based on cores
Config.overrideWebpackConfig((c) => c);
