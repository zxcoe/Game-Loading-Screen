import {createAstraStage} from './astra-stage.js';
const $=id=>document.getElementById(id);
const clips=$('idle-select');
let demoTimer=null,progress=0,auto=true;
const stage=createAstraStage($('viewport'),{
  onModelStatus:s=>{$('asset-status').textContent=s;},
  onClips:names=>{
    clips.replaceChildren();
    for(const name of names.filter(n=>n.startsWith('Idle_'))){const op=document.createElement('option');op.value=name;op.textContent=name.replace('Idle_','').replace(/([a-z])([A-Z])/g,'$1 $2');clips.appendChild(op)}
  }
});
function setProgress(v){const n=Number(v);if(!Number.isFinite(n))return;progress=Math.max(0,Math.min(100,n<=1?n*100:n));$('progress-label').textContent=Math.round(progress)+'%';$('progress-fill').style.width=progress+'%';$('stage-label').textContent=progress>=100?'READY TO DEPLOY':'LOADING GAME ASSETS';}
function setTip(s){$('tip-text').textContent=String(s).slice(0,240)}
function finish(){setProgress(100);$('stage-label').textContent='READY TO DEPLOY';}
// Call ASTRA_LOADING.setProgress(0..1) from the parent game's real loading state.
window.ASTRA_LOADING={setProgress,setTip,finish,setAnimation:name=>stage.setAnimation(name),setAuto:v=>{auto=!!v;stage.setAuto(auto);$('auto-toggle').textContent='AUTO: '+(auto?'ON':'OFF')}};
$('idle-select').onchange=e=>{stage.setAnimation(e.target.value);auto=false;$('auto-toggle').textContent='AUTO: OFF';};
$('auto-toggle').onclick=()=>window.ASTRA_LOADING.setAuto(!auto);
$('reset').onclick=()=>stage.resetCamera();
$('sound').onclick=()=>{}; // no audio deliberately included; button indicates muted status
$('demo').onclick=()=>{
  if(demoTimer){clearInterval(demoTimer);demoTimer=null;}
  setProgress(0);$('stage-label').textContent='DEMO LOADING — SIMULATED';
  const tips=['Stay aware of angles. Use cover and move with your team.','Switch positions after engagements to avoid predictable angles.','Check corners before moving into open space.'];
  let steps=0;
  demoTimer=setInterval(()=>{steps++;setProgress(Math.min(100,steps*3));$('stage-label').textContent=progress>=100?'DEMO READY':'DEMO LOADING — SIMULATED';if(steps%10===0)setTip(tips[Math.floor(steps/10)%tips.length]);if(progress>=100){clearInterval(demoTimer);demoTimer=null;}},200);
};
