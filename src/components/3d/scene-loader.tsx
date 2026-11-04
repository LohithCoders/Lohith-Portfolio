'use client';

import dynamic from 'next/dynamic';
import {useEffect,useState} from 'react';

const SceneRuntime=dynamic(()=>import('./scene-runtime').then(module=>module.SceneRuntime),{ssr:false});

function canUseWebGL(){
  try{
    const probe=document.createElement('canvas');
    const context=probe.getContext('webgl2')||probe.getContext('webgl');
    if(!context)return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}

export function SceneLoader(){
  const [supported,setSupported]=useState<boolean|null>(null);
  const [reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{
    const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory;
    const lowPower=navigator.hardwareConcurrency<=2||(memory!==undefined&&memory<=2);
    const frame=window.requestAnimationFrame(()=>setSupported(!lowPower&&canUseWebGL()));
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(query.matches);
    const motionFrame=window.requestAnimationFrame(update);query.addEventListener('change',update);
    return()=>{window.cancelAnimationFrame(frame);window.cancelAnimationFrame(motionFrame);query.removeEventListener('change',update);};
  },[]);

  return <div className="scene-shell">
    {supported===true?<SceneRuntime reducedMotion={reducedMotion}/>:<div className="scene-fallback-art"><span>LR</span><i/><b>INTERACTIVE SCENE UNAVAILABLE</b></div>}
  </div>;
}
