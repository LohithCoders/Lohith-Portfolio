'use client';

import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Line,useCursor} from '@react-three/drei';
import {gsap} from 'gsap';
import {usePathname,useRouter} from 'next/navigation';
import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Compass,Hand,Keyboard,Menu,MousePointer2,MousePointerClick} from 'lucide-react';
import * as THREE from 'three';
import {sceneCenter,sceneNodes,scenePosition,type SceneNode,type ScenePosition} from '@/data/scene';
import {navigationHoverEvent,type NavigationHoverDetail} from '@/lib/navigation-events';

type SceneRuntimeProps={reducedMotion:boolean};
type CameraState={x:number;y:number;z:number;tx:number;ty:number;tz:number};

function routeNode(pathname:string){return sceneNodes.find(node=>pathname===node.href||pathname.startsWith(`${node.href}/`));}

function CameraRig({pathname,mobile,reducedMotion}:{pathname:string;mobile:boolean;reducedMotion:boolean}){
  const {camera,invalidate}=useThree();
  const initialized=useRef(false);
  const state=useRef<CameraState>({x:0,y:0,z:12,tx:0,ty:0,tz:0});
  const target=routeNode(pathname);
  const focus=target?scenePosition(target,mobile):[0,0,0] as const;
  const [focusX,focusY,focusZ]=focus;

  useEffect(()=>{
    const tx=focusX,ty=focusY,tz=focusZ;
    const destination={x:tx,y:ty,z:mobile?9:11,tx,ty,tz};
    if(!initialized.current){
      Object.assign(state.current,destination);
      camera.position.set(destination.x,destination.y,destination.z);
      camera.lookAt(destination.tx,destination.ty,destination.tz);
      initialized.current=true;invalidate();return;
    }
    const timeline=gsap.timeline({onUpdate:invalidate});
    timeline.to(state.current,{...destination,duration:reducedMotion?0.01:1.25,ease:'power3.inOut'});
    return()=>{timeline.kill();};
  },[camera,focusX,focusY,focusZ,invalidate,mobile,reducedMotion]);

  useFrame(()=>{camera.position.set(state.current.x,state.current.y,state.current.z);camera.lookAt(state.current.tx,state.current.ty,state.current.tz);});
  return null;
}

function Core({reducedMotion}:{reducedMotion:boolean}){
  const core=useRef<THREE.Mesh>(null);
  const orbit=useRef<THREE.Group>(null);
  useFrame((_,delta)=>{if(reducedMotion)return;if(core.current)core.current.rotation.y+=delta*.12;if(orbit.current)orbit.current.rotation.z-=delta*.035;});
  return <group>
    <mesh ref={core}>
      <icosahedronGeometry args={[.56,2]}/>
      <meshStandardMaterial color="#0c1d38" emissive="#126382" emissiveIntensity={.64} roughness={.34} metalness={.48}/>
    </mesh>
    <mesh ref={orbit} rotation={[1.12,.22,-.35]}>
      <torusGeometry args={[1.12,.012,8,120]}/>
      <meshBasicMaterial color="#38bdf8" transparent opacity={.75}/>
    </mesh>
    <mesh rotation={[.55,.9,.45]}>
      <torusGeometry args={[1.3,.006,6,120]}/>
      <meshBasicMaterial color="#8b5cf6" transparent opacity={.48}/>
    </mesh>
    <pointLight color="#22d3ee" intensity={5} distance={8}/>
  </group>;
}

function ParticleField({mobile,reducedMotion}:{mobile:boolean;reducedMotion:boolean}){
  const ref=useRef<THREE.Points>(null);
  const positions=useMemo(()=>{
    const count=mobile?400:1200;const values=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const t=i*2.399963229728653;const radius=3.8+((i*37)%100)/100*5.5;
      values[i*3]=Math.cos(t)*radius;values[i*3+1]=Math.sin(t)*radius*.62;values[i*3+2]=((i*19)%100)/10-5;
    }
    return values;
  },[mobile]);
  useFrame((_,delta)=>{if(!reducedMotion&&ref.current)ref.current.rotation.z+=delta*.003;});
  return <points ref={ref} position={sceneCenter(mobile)}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color="#5abde9" size={mobile ? .018 : .022} transparent opacity={.44} sizeAttenuation depthWrite={false}/>
  </points>;
}

function Node({node,position,active,hovered,reducedMotion,onHover,onLeave,onSelect}:{node:SceneNode;position:ScenePosition;active:boolean;hovered:boolean;reducedMotion:boolean;onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void}){
  const mesh=useRef<THREE.Mesh>(null);
  useCursor(hovered);
  useFrame((_,delta)=>{
    if(!mesh.current)return;
    const scale=active?1.2:1;
    const nextScale=mesh.current.scale.x+(scale-mesh.current.scale.x)*(reducedMotion?1:Math.min(1,delta*8));
    mesh.current.scale.setScalar(nextScale);
    if(!reducedMotion)mesh.current.rotation.y+=delta*.13;
  });
  return <mesh ref={mesh} position={position} onPointerOver={event=>{event.stopPropagation();onHover(node);}} onPointerOut={event=>{event.stopPropagation();onLeave();}} onClick={event=>{event.stopPropagation();onSelect(node);}}>
    <icosahedronGeometry args={[.24,1]}/>
    <meshStandardMaterial color={active?'#83e8ff':'#102848'} emissive={active?'#22d3ee':'#147aa4'} emissiveIntensity={active?2.1:.7} roughness={.32} metalness={.4}/>
    <mesh position={[0,0,-.02]}>
      <sphereGeometry args={[.33,16,16]}/><meshBasicMaterial color={active?'#22d3ee':'#38bdf8'} transparent opacity={active ? .12 : .035}/>
    </mesh>
  </mesh>;
}

function Connections({mobile,highlight}:{mobile:boolean;highlight:string|null}){
  const center=sceneCenter(mobile);
  return <group>{sceneNodes.map(node=><Line key={node.id} points={[center,scenePosition(node,mobile)]} color={highlight===node.id?'#22d3ee':'#386586'} lineWidth={highlight===node.id?1.6:.7} transparent opacity={highlight===node.id ? .85 : .28}/>)}</group>;
}

function Universe({pathname,mobile,reducedMotion,onHover,onLeave,onSelect,hovered}:{pathname:string;mobile:boolean;reducedMotion:boolean;onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void;hovered:string|null}){
  const current=routeNode(pathname)?.id??null;
  return <>
    <fog attach="fog" args={['#050816',11,27]}/><ambientLight intensity={.52}/><pointLight position={[sceneCenter(mobile)[0],3,5]} color="#38bdf8" intensity={5} distance={18}/>
    <CameraRig pathname={pathname} mobile={mobile} reducedMotion={reducedMotion}/>
    <group position={sceneCenter(mobile)}><Core reducedMotion={reducedMotion}/></group><Connections mobile={mobile} highlight={hovered??current}/>
    {sceneNodes.map(node=><Node key={node.id} node={node} position={scenePosition(node,mobile)} active={hovered===node.id||current===node.id} hovered={hovered===node.id} reducedMotion={reducedMotion} onHover={onHover} onLeave={onLeave} onSelect={onSelect}/>)}
    <ParticleField mobile={mobile} reducedMotion={reducedMotion}/>
  </>;
}

export function SceneRuntime({reducedMotion}:SceneRuntimeProps){
  const pathname=usePathname();const router=useRouter();
  const [mobile,setMobile]=useState(false);const [visible,setVisible]=useState(true);const [interactive,setInteractive]=useState(pathname==='/');
  const [hovered,setHovered]=useState<SceneNode|null>(null);const [ready,setReady]=useState(false);const [shortViewport,setShortViewport]=useState(false);
  useEffect(()=>{window.dispatchEvent(new CustomEvent<NavigationHoverDetail>(navigationHoverEvent,{detail:hovered?.id??null}));},[hovered]);
  useEffect(()=>{const query=window.matchMedia('(max-height:560px)');const update=()=>setShortViewport(query.matches);const initialUpdate=requestAnimationFrame(update);query.addEventListener('change',update);window.addEventListener('resize',update,{passive:true});return()=>{cancelAnimationFrame(initialUpdate);query.removeEventListener('change',update);window.removeEventListener('resize',update);};},[]);
  useEffect(()=>{const query=window.matchMedia('(max-width: 767px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  useEffect(()=>{const root=document.querySelector('.scene-shell');if(!root)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting===true&&document.visibilityState==='visible'));observer.observe(root);const onVisibility=()=>setVisible(document.visibilityState==='visible');document.addEventListener('visibilitychange',onVisibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);};},[]);
  useEffect(()=>{const update=()=>setInteractive(pathname==='/'&&window.scrollY<window.innerHeight*.82);update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[pathname]);
  const selectedNode=hovered;
  const activate=(node:SceneNode)=>{setHovered(null);router.push(node.href);};

  return <>
    <Canvas className="scene-canvas" aria-hidden="true" camera={{position:[0,0,11],fov:43}} dpr={mobile?[1,1.25]:[1,1.6]} frameloop={!visible?'never':reducedMotion||pathname!=='/'?'demand':'always'} gl={{alpha:true,antialias:!mobile,powerPreference:'high-performance'}} onCreated={()=>setReady(true)} fallback={<div className="scene-fallback-art"><span>LR</span><i/><b>INTERACTIVE SCENE UNAVAILABLE</b></div>} style={{pointerEvents:pathname==='/'&&interactive?'auto':'none',opacity:pathname==='/'&&interactive?(mobile ? .18 : 1):pathname==='/' ? .22 : .08}}>
      <Suspense fallback={null}><Universe pathname={pathname} mobile={mobile} reducedMotion={reducedMotion} onHover={setHovered} onLeave={()=>setHovered(null)} onSelect={activate} hovered={hovered?.id??null}/></Suspense>
    </Canvas>
    {ready&&pathname==='/'&&interactive&&<aside className={`scene-tooltip${mobile?' is-mobile':''}${shortViewport?' is-compact':''}`} aria-label="3D navigation instructions">
      <div className="scene-tooltip-heading"><span className="scene-tooltip-icon"><Compass aria-hidden="true"/></span><span><b>HOW TO EXPLORE</b><small>{mobile?'Navigate with touch':'Interactive portfolio map'}</small></span></div>
      <div className="scene-tooltip-controls">
        {mobile?<>
          <div className="scene-control"><span className="scene-control-icon"><Hand aria-hidden="true"/></span><span><b>TAP A NODE</b><small>Open a section</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><Menu aria-hidden="true"/></span><span><b>MENU</b><small>Browse all sections</small></span></div>
        </>:<>
          <div className="scene-control"><span className="scene-control-icon"><MousePointer2 aria-hidden="true"/></span><span><b>HOVER</b><small>Preview a section</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><MousePointerClick aria-hidden="true"/></span><span><b>CLICK</b><small>Open a section</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><Keyboard aria-hidden="true"/></span><span><b>TAB + ENTER</b><small>Navigate by keyboard</small></span></div>
        </>}
      </div>
      <div className="scene-tooltip-compact-guide">{mobile?<span><Hand aria-hidden="true"/> TAP A NODE · MENU FOR ALL SECTIONS</span>:<><span><MousePointer2 aria-hidden="true"/> HOVER TO PREVIEW</span><span><MousePointerClick aria-hidden="true"/> CLICK TO OPEN</span></>}</div>
      {selectedNode&&<div className="scene-tooltip-preview"><span className="scene-preview-dot"/><b>{selectedNode.label}</b><span>{selectedNode.description}</span></div>}
    </aside>}
    {pathname==='/'&&interactive&&<nav className="scene-accessible-nav" aria-label="3D universe sections">{sceneNodes.map(node=>{const [x,y]=mobile?node.hitMobile:node.hitDesktop;return <button className="scene-accessible-button" key={node.id} type="button" style={{left:`${x}%`,top:`${y}%`}} onMouseEnter={()=>setHovered(node)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(node)} onBlur={()=>setHovered(null)} onClick={()=>activate(node)} aria-label={`Open ${node.label}`}><span>{node.label}</span></button>;})}</nav>}
    {!ready&&<div className="scene-loading" role="status"><span className="scene-loader-dot"/>Loading interactive scene</div>}
  </>;
}
