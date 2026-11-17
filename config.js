// ===== Loading screen settings =====
// Change these to customize the screen without touching main.js.

export const CONFIG = {
  // Big text at the top of the screen
  title: 'Loading World',

  // Path to your 3D model. Drop your file in the models/ folder and
  // change this to match its name. If the file isn't found, a
  // placeholder shape is shown instead.
  modelPath: './models/model.glb',

  // Slowly spin the model when nobody is dragging it
  autoRotate: true,
  autoRotateSpeed: 1.5,

  // Minimum time (milliseconds) the loading bar takes to fill,
  // so the screen doesn't flash by instantly. 4000 = 4 seconds.
  minLoadTime: 4000,

  // Colors
  backgroundColor: '#0b0f1a',
  accentColor: '#4f8cff',

  // Tips that cycle at the bottom while loading
  tips: [
    'Tip: Drag the model to spin it around.',
    'Tip: Scroll to zoom in and out.',
    'Tip: Click the model to see what happens.',
    'Tip: Swap in your own model in config.js.',
  ],
  tipInterval: 3500, // ms between tips
};
