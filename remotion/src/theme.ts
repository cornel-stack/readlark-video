// ReadLark "Daybreak" brand palette and shared constants.
// Every template imports from here so the paper look stays identical everywhere.

export const DAYBREAK = {
  coral: '#F4603E', // Dawn Coral — primary accent
  amber: '#FFAE3D', // Dawn Amber — secondary accent
  paper: '#FAF5EB', // warm paper — background
  ink: '#232041', // indigo — ink / text
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Handwriting fonts (OFL), rendered to paths by the stroke engine later.
export const HAND_FONT = 'Caveat, "Patrick Hand", cursive';
