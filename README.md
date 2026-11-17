# Game Loading Screen

An interactive 3D loading screen built with [Three.js](https://threejs.org/).

## Preview it

Double-click **`start.bat`**. It opens http://localhost:8000 in your browser.
(It needs Python installed. Opening `index.html` directly won't work, because browsers block loading 3D files that way.)

## Use your own model

1. Put your model in the `models/` folder (`.glb` works best).
2. In `config.js`, set `modelPath` to its file name, e.g. `'./models/my-character.glb'`.

If the model has animations from Blender, the first one plays automatically, and clicking the model cycles through the rest.

## Customize

Edit **`config.js`** to change the title, colors, tips, spin speed, and minimum loading time.

## Files

- `index.html`: page layout (title, loading bar, Play button)
- `style.css`: look of the UI
- `main.js`: 3D scene, model loading, click interactions, loading bar logic
- `config.js`: settings you can tweak
- `models/`: your 3D model files
