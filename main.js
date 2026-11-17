import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

// ---------- UI elements ----------
const ui = document.getElementById('ui');
const fillEl = document.getElementById('fill');
const percentEl = document.getElementById('percent');
const labelEl = document.getElementById('label');
const tipEl = document.getElementById('tip');
const playBtn = document.getElementById('play');

document.getElementById('title').textContent = CONFIG.title;
document.documentElement.style.setProperty('--accent', CONFIG.accentColor);

// ---------- Renderer, scene, camera ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.backgroundColor);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.8, 5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 10;
controls.autoRotate = CONFIG.autoRotate;
controls.autoRotateSpeed = CONFIG.autoRotateSpeed;

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(CONFIG.accentColor, 3);
rimLight.position.set(-4, 2, -3);
scene.add(rimLight);

// Glowing ring under the model
const ring = new THREE.Mesh(
  new THREE.RingGeometry(1.3, 1.4, 64),
  new THREE.MeshBasicMaterial({ color: CONFIG.accentColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -1.2;
scene.add(ring);

// Everything clickable goes inside this group
const holder = new THREE.Group();
scene.add(holder);

// ---------- Model loading ----------
let mixer = null;        // plays animations baked into the model (if any)
let clips = [];
let clipIndex = -1;
let currentAction = null;

let realProgress = 0;    // 0..1 from the actual file download
let realDone = false;

// Scale and center any model so it fits nicely on screen
function fitToView(object, targetSize = 2.2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(targetSize / maxDim);
  box.setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
}

function addPlaceholder() {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.7, 0.25, 160, 24),
    new THREE.MeshStandardMaterial({ color: CONFIG.accentColor, metalness: 0.6, roughness: 0.25 })
  );
  holder.add(mesh);
}

const loader = new GLTFLoader();
loader.load(
  CONFIG.modelPath,
  (gltf) => {
    const model = gltf.scene;
    fitToView(model);
    holder.add(model);

    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      clips = gltf.animations;
      playNextClip(); // start the first animation right away
    }
    realDone = true;
  },
  (xhr) => {
    if (xhr.total) realProgress = xhr.loaded / xhr.total;
  },
  () => {
    console.info(`No model at ${CONFIG.modelPath} yet, showing placeholder.`);
    addPlaceholder();
    realDone = true;
  }
);

function playNextClip() {
  clipIndex = (clipIndex + 1) % clips.length;
  const next = mixer.clipAction(clips[clipIndex]);
  next.reset().play();
  if (currentAction && currentAction !== next) currentAction.crossFadeTo(next, 0.3, false);
  currentAction = next;
}

// ---------- Click / hover on the model ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = null;
let bounce = 1; // 0..1 while the click animation plays, 1 = idle

function hitModel(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(holder, true).length > 0;
}

canvas.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });

canvas.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 5) return; // that was a drag, not a click
  if (hitModel(e)) onModelClick();
});

canvas.addEventListener('pointermove', (e) => {
  if (e.buttons) return;
  canvas.style.cursor = hitModel(e) ? 'pointer' : 'grab';
});

function onModelClick() {
  // If the model has its own animations, cycle through them.
  // Otherwise, do a hop-and-spin.
  if (mixer && clips.length > 1) playNextClip();
  else bounce = 0;
}

// ---------- Loading bar + tips ----------
const startTime = performance.now();
let shownProgress = 0;
let ready = false;

function updateProgress() {
  const timeProgress = Math.min((performance.now() - startTime) / CONFIG.minLoadTime, 1);
  const target = Math.min(timeProgress, realDone ? 1 : realProgress * 0.99);
  shownProgress += (target - shownProgress) * 0.08;
  if (target === 1 && shownProgress > 0.995) shownProgress = 1;

  const pct = Math.round(shownProgress * 100);
  fillEl.style.width = pct + '%';
  percentEl.textContent = pct + '%';

  if (shownProgress === 1 && !ready) {
    ready = true;
    labelEl.textContent = 'Ready!';
    playBtn.hidden = false;
  }
}

let tipIndex = 0;
tipEl.textContent = CONFIG.tips[0] ?? '';
setInterval(() => {
  if (ready || CONFIG.tips.length < 2) return;
  tipEl.classList.add('fade');
  setTimeout(() => {
    tipIndex = (tipIndex + 1) % CONFIG.tips.length;
    tipEl.textContent = CONFIG.tips[tipIndex];
    tipEl.classList.remove('fade');
  }, 400);
}, CONFIG.tipInterval);

playBtn.addEventListener('click', () => {
  ui.classList.add('hidden');
  // TODO: start the game / switch scenes here.
});

// ---------- Main loop ----------
const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  // Gentle idle float
  let y = Math.sin(t * 1.5) * 0.08;

  // Hop-and-spin after a click
  if (bounce < 1) {
    bounce = Math.min(bounce + dt * 1.8, 1);
    y += Math.sin(bounce * Math.PI) * 0.7;
    holder.rotation.y += dt * 12 * (1 - bounce);
  }
  holder.position.y = y;

  ring.material.opacity = 0.35 + Math.sin(t * 2) * 0.15;

  if (mixer) mixer.update(dt);
  controls.update();
  updateProgress();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
