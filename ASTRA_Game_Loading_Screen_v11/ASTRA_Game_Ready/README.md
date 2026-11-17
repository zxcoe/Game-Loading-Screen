# ASTRA — FPS Loading Screen v1.1

A **web-loading-screen prototype** featuring an original anime-style female character holding a rifle. It includes a real `.glb` (gltf 2.0) 3D model, 26-joint rig, 6 animation clips, a standalone Three.js loading-screen demo, and React/Vite integration.

## What's included

- `public/index.html` — ready-to-view standalone static demo page
- `public/style.css`, `public/main.js`, `public/astra-stage.js` — page design, progress API, and 3D viewer
- `public/models/ASTRA_GameReady.glb` — character model with explicit PBR matte vertex-color material
- `react/` — React + Vite version using the same renderer
- `tools/finalize_glb.py` — model packaging source (input is the v1.0 GLB)

## Open without Blender

The page **must be served over HTTP** due to browser security restrictions and ES module loading. Directly double-clicking `index.html` may fail. You do not need Blender.

Option A: use Python (from this package's directory):

```bash
cd public
python -m http.server 8000
```

Open http://localhost:8000 in Chrome or Edge. The standalone page loads Three.js from a CDN, so internet is required.

Option B: React app (Node.js required):

```bash
cd react
npm install
npm run dev
```

Open the local address printed by Vite. To compile for hosting, run `npm run build`, then serve `react/dist` with any static hosting service.

## Connect the loading progress to your actual FPS game

Both standalone and React versions expose:

```js
window.ASTRA_LOADING.setProgress(0.42); // 42%; a percentage 0–100 also works
window.ASTRA_LOADING.setTip('Hold angles and watch your teammates.');
window.ASTRA_LOADING.setAnimation('Idle_WeaponAdjust');
window.ASTRA_LOADING.setAuto(true); // resume periodic random idles
window.ASTRA_LOADING.finish(); // show 100% / ready
```

`TEST LOADING` is **explicitly a simulated demo** and is not measuring game assets. Wire `setProgress` to actual load events in your game.

Animation clips: `Idle_Breathe`, `Idle_Look`, `Idle_WeaponAdjust`, `Idle_Settle`, `Blink_1`, `Blink_2`. The stage blends between idle clips and layers standalone blinks above them.

## Rendering and known limitations

- Model and clips are real glTF data and can be loaded in Three.js. All model geometry retains colored vertices, and this GLB has an explicit matte material.
- The browser preview upgrades that matte material to a discrete **MeshToonMaterial** with four shade bands.
- Rigid/procedurally shaped mesh parts and blended skin weights can still show intersections, most noticeably at wrists, elbows, and hair. Two-hand weapon positioning is approximate and not true IK.
- It is a **stylized prototype**, not a faithful high-poly sculpt of the original concept artwork. Use this as a loading-screen character while continuing optional character-art QA.
- Running the browser preview was blocked by the current isolated environment's network/file access policy. Export and animation structures were validated, but the final render wasn't browser-QA'd here.
- Character size is about 3.4 abstract scene units tall. Fit/scale further if embedding in a 3D game scene.

## Performance / production integration

309 separate skinned mesh primitives mean high draw calls for low-power mobile hardware. The viewer caps pixel ratio and disables frustum culling for animated parts. For production shipping at scale, merge meshes by material and skin or bake the character into fewer draw calls, optimize texture/material count, and test on target devices.
