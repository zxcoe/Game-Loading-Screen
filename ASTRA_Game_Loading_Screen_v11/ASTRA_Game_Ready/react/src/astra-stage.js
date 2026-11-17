import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** ASTRA WebGL scene, intentionally independent of the page's React/UI state.
 * Runtime asset and external dependencies must be served via HTTP(S).
 */
export function createAstraStage(host, {modelUrl = './models/ASTRA_GameReady.glb', onModelStatus = () => {}, onClips = () => {}} = {}) {
  const scene = new THREE.Scene();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label','Rotatable animated 3D character');
  host.appendChild(canvas);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'}); }
  catch(err) { onModelStatus('WebGL unavailable: '+err.message); return {dispose(){canvas.remove()}, setAnimation(){},setAuto(){}}; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, window.innerWidth < 800 ? 1.35 : 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000,0);
  const cam = new THREE.PerspectiveCamera(34,1,0.05,50);
  cam.position.set(3.85,3.05,7.65);
  const controls = new OrbitControls(cam,canvas);
  controls.target.set(0,1.67,0);
  controls.minPolarAngle=.8; controls.maxPolarAngle=2.05;
  controls.minDistance=4.0; controls.maxDistance=11;
  controls.enablePan=false; controls.enableDamping=true; controls.dampingFactor=.07;
  const key = new THREE.DirectionalLight(0xf4e8ff, 3.1); key.position.set(4.5,8,6); scene.add(key);
  const fill = new THREE.DirectionalLight(0x8d77e5,1.05);fill.position.set(-4,3,2);scene.add(fill);
  const rim = new THREE.DirectionalLight(0xd492ff,2.15);rim.position.set(-3,5,-5);scene.add(rim);
  scene.add(new THREE.AmbientLight(0xb8a3df,.8));

  // Simple graphic stage elements (no environment texture dependencies).
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.75,.09,90),new THREE.MeshBasicMaterial({color:0x1d1a2b}));
  pedestal.position.set(1.13,-.1,0);scene.add(pedestal);
  for(const [r,col,opacity] of [[1.47,0xb265f6,.9],[1.72,0x6f4fa7,.3],[1.95,0x9963d4,.12]]){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r,.011,5,110),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(1.13,-.027,0);scene.add(ring);
  }
  const deck = new THREE.GridHelper(8,28,0x68528d,0x353049);
  deck.position.set(1.13,-.044,0);scene.add(deck);

  // Discrete gradient levels give the source vertex colors an anime-ish material response.
  const grad = new Uint8Array([62,62,62,255, 145,145,145,255, 215,215,215,255, 255,255,255,255]);
  const gradient = new THREE.DataTexture(grad,4,1,THREE.RGBAFormat);
  gradient.magFilter=THREE.NearestFilter;gradient.minFilter=THREE.NearestFilter;gradient.needsUpdate=true;
  let model=null,mixer=null,actions=new Map(),current='Idle_Breathe',auto=true,elapsed=0,nextIdle=7,nextBlink=3,disposed=false;
  const timer=new THREE.Clock();
  const modelOffset = new THREE.Group(); modelOffset.position.x=1.13;scene.add(modelOffset);
  const loader = new GLTFLoader();
  onModelStatus('Loading 3D character…');
  loader.load(modelUrl, (gltf)=>{
    if(disposed)return;
    model=gltf.scene;modelOffset.add(model);
    model.traverse(obj=>{
      if(!obj.isMesh)return;
      // MeshToonMaterial works on skinned meshes and keeps all COLOR_0 colors.
      const mat=new THREE.MeshToonMaterial({color:0xffffff,vertexColors:true,gradientMap:gradient,side:THREE.DoubleSide});
      obj.material=mat;
      obj.frustumCulled=false; // skinned bounds otherwise flicker during movement
    });
    mixer=new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip=>actions.set(clip.name,mixer.clipAction(clip)));
    onClips([...actions.keys()]);
    if(actions.has('Idle_Breathe')) actions.get('Idle_Breathe').play();
    current='Idle_Breathe';
    onModelStatus('Character loaded · drag to rotate · scroll to zoom');
  }, (ev)=>{ if(ev.total>0)onModelStatus('Loading model '+Math.round(ev.loaded/ev.total*100)+'%'); },
  (err)=>onModelStatus('Could not load 3D asset. Serve this folder over HTTP. '+(err.message||'')));

  function switchIdle(name){
    if(!actions.has(name))return false;
    const old=actions.get(current),next=actions.get(name);
    if(old===next)return true;
    next.reset().setLoop(THREE.LoopRepeat,Infinity).play();
    if(old)old.crossFadeTo(next,.35,false);
    current=name;
    return true;
  }
  function blink(){
    const choice=Math.random()<.5?'Blink_1':'Blink_2';
    const action=actions.get(choice);if(!action)return;
    action.reset();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=false;action.play();
    // Blink clips control eye scale only; they can safely overlap the idle clip.
  }
  const ro=new ResizeObserver(()=>{
    const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);
    cam.aspect=width/height;
    cam.fov=width < 640 ? 46:34;
    cam.updateProjectionMatrix();renderer.setSize(width,height,false);
  });ro.observe(host);
  let frameId=0;
  function frame(){
    if(disposed)return;
    frameId=requestAnimationFrame(frame);
    const dt=Math.min(timer.getDelta(),.05);
    if(!document.hidden){
      if(mixer)mixer.update(dt);
      elapsed+=dt;
      if(actions.size&&auto&&elapsed>nextIdle){
        const options=['Idle_Breathe','Idle_Look','Idle_WeaponAdjust','Idle_Settle'];
        switchIdle(options[Math.floor(Math.random()*options.length)]);
        nextIdle=elapsed+5+Math.random()*5;
      }
      if(actions.size&&elapsed>nextBlink){blink();nextBlink=elapsed+2.7+Math.random()*3;}
      controls.update();renderer.render(scene,cam);
    }
  }
  frame();
  return {
    setAnimation(name){auto=false;return switchIdle(name)},
    setAuto(value){auto=Boolean(value);if(auto)nextIdle=elapsed+5},
    resetCamera(){cam.position.set(3.85,3.05,7.65);controls.target.set(0,1.67,0);controls.update()},
    dispose(){disposed=true;cancelAnimationFrame(frameId);ro.disconnect();controls.dispose();mixer?.stopAllAction();
      scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose(); if(obj.material){(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>m.dispose());}});
      gradient.dispose();renderer.dispose();canvas.remove();}
  };
}
