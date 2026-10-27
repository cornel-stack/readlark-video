import {Config} from '@remotion/cli/config';

// Deterministic, free, open-source render settings. H.264 + AAC is set at the
// package step via FFmpeg; here we keep the defaults sane for local previews.
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null); // let Remotion pick based on cores
Config.overrideWebpackConfig((c) => c);

// Serve the repo-level assets/ (plates, depth layers, hand cutouts, audio) so
// staticFile('hand/cutouts/write.png'), staticFile('art/CL-11/layers/...') resolve.
Config.setPublicDir('../assets');
