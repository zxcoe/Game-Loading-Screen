import React,{useEffect,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import {createAstraStage} from './astra-stage.js';
import './style.css';
function App(){
  const host=useRef(null),stage=useRef(null),demo=useRef(null);
  const [progress,setProgress]=useState(0),[tip,setTip]=useState('Stay aware of angles. Use cover and move with your team.');
  const [clips,setClips]=useState([]),[clip,setClip]=useState('Idle_Breathe'),[auto,setAuto]=useState(true),[status,setStatus]=useState('Loading 3D character…'),[sim,setSim]=useState(false);
  // Expose progress from the host game's asset loader: window.ASTRA_LOADING.setProgress(0.4)
  const updateRef=useRef({}); updateRef.current={setProgress,setTip,setAuto,setClip};
  useEffect(()=>{
    stage.current=createAstraStage(host.current,{modelUrl:'/models/ASTRA_GameReady.glb',onModelStatus:setStatus,onClips:setClips});
    const api={
      setProgress:(v)=>{const n=Number(v);if(Number.isFinite(n))updateRef.current.setProgress(Math.max(0,Math.min(100,n<=1?n*100:n)))},
      setTip:(v)=>updateRef.current.setTip(String(v).slice(0,240)),
      finish:()=>updateRef.current.setProgress(100),
      setAnimation:(name)=>{stage.current?.setAnimation(name);updateRef.current.setClip(name);updateRef.current.setAuto(false)},
      setAuto:(v)=>{stage.current?.setAuto(Boolean(v));updateRef.current.setAuto(Boolean(v))}
    };
    window.ASTRA_LOADING=api;
    return()=>{stage.current?.dispose();stage.current=null;delete window.ASTRA_LOADING;if(demo.current)clearInterval(demo.current)};
  },[]);
  function startDemo(){if(demo.current)clearInterval(demo.current);setProgress(0);setSim(true);let i=0;demo.current=setInterval(()=>{i++;setProgress(Math.min(100,i*3));if(i>=34){clearInterval(demo.current);demo.current=null;}},200)}
  return <div className="app">
    <div className="scanline"/><div className="ambient ambient-a"/><div className="ambient ambient-b"/>
    <header className="topbar"><div className="brand"><span className="brand-symbol">✦</span><div><b>PROJECT // ASTRA</b><small>TACTICAL OPERATIVE SYSTEM</small></div></div><span className="top-status"><i/> MODEL // ASTRA 01</span><div className="top-actions"><button onClick={()=>stage.current?.resetCamera()} title="Reset camera">↺</button><button title="Sound disabled">♫ OFF</button></div></header>
    <div ref={host} className="viewport" aria-label="3D character preview"/>
    <main className="content"><div className="eyebrow"><span className="line"/> FPS ONLINE EXPERIENCE <span className="line"/></div>
    <div className="slogan">STAND BY<br/><em>FOR DEPLOYMENT</em><span className="period">.</span></div>
    <div className="subtitle">OPERATIVE: <b>ASTRA</b> <span className="rule">/</span> CLASS: ASSAULT</div>
    <div className="detail">A quiet moment before the match begins. Customize the character’s idle while assets prepare.</div>
    <section className="load-box" aria-label="Loading status"><div className="load-header"><span>{sim&&progress<100?'DEMO LOADING — SIMULATED':progress>=100?'READY TO DEPLOY':'AWAITING GAME PROGRESS'}</span><strong>{Math.round(progress)}%</strong></div><div className="track"><div className="fill" style={{width:progress+'%'}}/><div className="notch"/></div><div className="progress-sub"><span>{status}</span><span className="tag">PREVIEW BUILD</span></div></section>
    <div className="tip"><span className="tip-mark">◇</span><div><b>TACTICAL TIP</b><p>{tip}</p></div></div>
    <div className="controls-panel"><label htmlFor="idle-select">CHARACTER ANIMATION</label><select id="idle-select" value={clip} onChange={e=>{setClip(e.target.value);setAuto(false);stage.current?.setAnimation(e.target.value)}}>{clips.filter(n=>n.startsWith('Idle_')).map(c=><option key={c} value={c}>{c.replace('Idle_','').replace(/([a-z])([A-Z])/g,'$1 $2')}</option>)}</select><button onClick={()=>{setAuto(!auto);stage.current?.setAuto(!auto)}}>AUTO: {auto?'ON':'OFF'}</button><button onClick={startDemo}>▶ TEST LOADING</button></div>
    </main><div className="character-tag"><span className="mini-line"/><b>ASTRA</b><span>OPERATIVE // 001</span><small>DRAG TO ROTATE · SCROLL TO ZOOM</small></div><footer><span>ASTRA / ANIME FPS CHARACTER STUDY</span><span>WEBGL · THREE.JS · GLTF</span><span>DEMO UI — NOT A LIVE GAME LOAD</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
