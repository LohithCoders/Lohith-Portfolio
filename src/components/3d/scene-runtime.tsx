'use client';

import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Line,useCursor} from '@react-three/drei';
import {gsap} from 'gsap';
import {Compass,Hand,Keyboard,MousePointer2,MousePointerClick,X} from 'lucide-react';
import {usePathname,useRouter} from 'next/navigation';
import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {sceneCenter,sceneNodes,scenePosition,type SceneNode,type ScenePosition} from '@/data/scene';
import {navigationHoverEvent,type NavigationHoverDetail} from '@/lib/navigation-events';

type SceneRuntimeProps={reducedMotion:boolean};
type CameraState={x:number;y:number;z:number;tx:number;ty:number;tz:number};

const colors={obsidian:'#111613',sage:'#A8B89A',terracotta:'#D77C5C',lavender:'#A99AE0',champagne:'#D4B477',ivory:'#F2EEE5',stone:'#B5B9AF',line:'#4A554A'};
function nodeAccent(id:string){if(id==='projects'||id==='leadership')return colors.terracotta;if(id==='skills'||id==='research')return colors.lavender;if(id==='achievements')return colors.champagne;if(id==='contact')return colors.ivory;return colors.sage;}

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
  useFrame((_,delta)=>{if(reducedMotion)return;if(core.current)core.current.rotation.y+=delta*.08;if(orbit.current)orbit.current.rotation.z-=delta*.022;});
  return <group>
    <mesh ref={core}>
      <dodecahedronGeometry args={[.62,1]}/>
      <meshPhysicalMaterial color="#D8D1C3" roughness={.25} metalness={.22} clearcoat={.86} clearcoatRoughness={.18}/>
    </mesh>
    <mesh scale={.73} rotation={[.48,.86,.24]}>
      <icosahedronGeometry args={[.62,1]}/>
      <meshPhysicalMaterial color="#596650" roughness={.34} metalness={.42} clearcoat={.6}/>
    </mesh>
    <mesh ref={orbit} rotation={[1.12,.22,-.35]}>
      <torusGeometry args={[1.12,.018,8,120]}/>
      <meshStandardMaterial color={colors.champagne} roughness={.3} metalness={.72}/>
    </mesh>
    <mesh rotation={[.55,.9,.45]}>
      <torusGeometry args={[1.3,.009,6,120]}/>
      <meshStandardMaterial color={colors.sage} roughness={.4} metalness={.42}/>
    </mesh>
    <pointLight color={colors.champagne} intensity={2.2} distance={8}/>
  </group>;
}

function ParticleField({mobile,reducedMotion}:{mobile:boolean;reducedMotion:boolean}){
  const ref=useRef<THREE.Points>(null);
  const positions=useMemo(()=>{
    const count=mobile?180:640;const values=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const t=i*2.399963229728653;const radius=3.8+((i*37)%100)/100*5.5;
      values[i*3]=Math.cos(t)*radius;values[i*3+1]=Math.sin(t)*radius*.62;values[i*3+2]=((i*19)%100)/10-5;
    }
    return values;
  },[mobile]);
  useFrame((_,delta)=>{if(!reducedMotion&&ref.current)ref.current.rotation.z+=delta*.003;});
  return <points ref={ref} position={sceneCenter(mobile)}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color={colors.sage} size={mobile ? .014 : .018} transparent opacity={.28} sizeAttenuation depthWrite={false}/>
  </points>;
}

function NodeGeometry({id}:{id:string}){
  switch(id){
    case 'about':return <dodecahedronGeometry args={[.24,0]}/>;
    case 'skills':return <octahedronGeometry args={[.27,0]}/>;
    case 'projects':return <icosahedronGeometry args={[.24,1]}/>;
    case 'experience':return <tetrahedronGeometry args={[.28,0]}/>;
    case 'achievements':return <torusKnotGeometry args={[.17,.055,48,8]}/>;
    case 'leadership':return <boxGeometry args={[.32,.32,.32]}/>;
    case 'research':return <torusGeometry args={[.21,.065,8,20]}/>;
    default:return <sphereGeometry args={[.24,20,16]}/>;
  }
}

function Node({node,position,active,hovered,reducedMotion,onHover,onLeave,onSelect}:{node:SceneNode;position:ScenePosition;active:boolean;hovered:boolean;reducedMotion:boolean;onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void}){
  const mesh=useRef<THREE.Mesh>(null);
  const accent=nodeAccent(node.id);
  useCursor(hovered);
  useFrame((_,delta)=>{
    if(!mesh.current)return;
    const scale=active?1.2:1;
    const nextScale=mesh.current.scale.x+(scale-mesh.current.scale.x)*(reducedMotion?1:Math.min(1,delta*8));
    mesh.current.scale.setScalar(nextScale);
    if(!reducedMotion)mesh.current.rotation.y+=delta*.13;
  });
  return <mesh ref={mesh} position={position} onPointerOver={event=>{event.stopPropagation();onHover(node);}} onPointerOut={event=>{event.stopPropagation();onLeave();}} onClick={event=>{event.stopPropagation();onSelect(node);}}>
    <NodeGeometry id={node.id}/>
    <meshPhysicalMaterial color={active?colors.ivory:accent} emissive={accent} emissiveIntensity={active ? .38 : .045} roughness={active ? .26 : .43} metalness={node.id==='achievements'||node.id==='projects' ? .56 : .18} clearcoat={.52} clearcoatRoughness={.22}/>
    <mesh scale={1.34}>
      <sphereGeometry args={[.24,16,16]}/><meshPhysicalMaterial color={accent} transparent opacity={active ? .13 : .035} roughness={.18} metalness={.12} clearcoat={.7} depthWrite={false}/>
    </mesh>
  </mesh>;
}

function Connections({mobile,highlight}:{mobile:boolean;highlight:string|null}){
  const center=sceneCenter(mobile);
  return <group>{sceneNodes.map(node=><Line key={node.id} points={[center,scenePosition(node,mobile)]} color={highlight===node.id?colors.champagne:colors.line} lineWidth={highlight===node.id?1.2:.55} transparent opacity={highlight===node.id ? .76 : .24}/>)}</group>;
}

function Universe({pathname,mobile,reducedMotion,onHover,onLeave,onSelect,hovered}:{pathname:string;mobile:boolean;reducedMotion:boolean;onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void;hovered:string|null}){
  const current=routeNode(pathname)?.id??null;
  return <>
    <fog attach="fog" args={[colors.obsidian,11,27]}/><ambientLight intensity={.58} color="#D8D4C7"/><directionalLight position={[-4,5,7]} color={colors.champagne} intensity={2.1}/><pointLight position={[sceneCenter(mobile)[0]+3,-1,3]} color={colors.sage} intensity={1.6} distance={16}/>
    <CameraRig pathname={pathname} mobile={mobile} reducedMotion={reducedMotion}/>
    <group position={sceneCenter(mobile)}><Core reducedMotion={reducedMotion}/></group><Connections mobile={mobile} highlight={hovered??current}/>
    {sceneNodes.map(node=><Node key={node.id} node={node} position={scenePosition(node,mobile)} active={hovered===node.id||current===node.id} hovered={hovered===node.id} reducedMotion={reducedMotion} onHover={onHover} onLeave={onLeave} onSelect={onSelect}/>)}
    <ParticleField mobile={mobile} reducedMotion={reducedMotion}/>
  </>;
}

export function SceneRuntime({reducedMotion}:SceneRuntimeProps){
  const pathname=usePathname();const router=useRouter();
  const [mobile,setMobile]=useState(false);const [visible,setVisible]=useState(true);const [interactive,setInteractive]=useState(pathname==='/');
  const [hovered,setHovered]=useState<SceneNode|null>(null);const [ready,setReady]=useState(false);const [shortViewport,setShortViewport]=useState(false);const [showGuide,setShowGuide]=useState(pathname==='/');const [guideExpanded,setGuideExpanded]=useState(true);
  useEffect(()=>{window.dispatchEvent(new CustomEvent<NavigationHoverDetail>(navigationHoverEvent,{detail:hovered?.id??null}));},[hovered]);
  useEffect(()=>{const query=window.matchMedia('(max-width: 767px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  useEffect(()=>{const query=window.matchMedia('(max-height:720px)');const update=()=>setShortViewport(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  useEffect(()=>{const root=document.querySelector('.scene-shell');if(!root)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting===true&&document.visibilityState==='visible'));observer.observe(root);const onVisibility=()=>setVisible(document.visibilityState==='visible');document.addEventListener('visibilitychange',onVisibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);};},[]);
  useEffect(()=>{const update=()=>{setInteractive(pathname==='/'&&window.scrollY<window.innerHeight*.82);setShowGuide(pathname==='/'&&window.scrollY<48);};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[pathname]);
  const activate=(node:SceneNode)=>{setHovered(null);router.push(node.href);};

  return <>
    <Canvas className="scene-canvas" aria-hidden="true" camera={{position:[0,0,11],fov:43}} dpr={mobile?[1,1.15]:[1,1.35]} frameloop={!visible?'never':reducedMotion||pathname!=='/'||!interactive?'demand':'always'} gl={{alpha:true,antialias:!mobile,powerPreference:'high-performance'}} onCreated={()=>setReady(true)} fallback={<div className="scene-fallback-art"><span>LR</span><i/><b>INTERACTIVE SCENE UNAVAILABLE</b></div>} style={{pointerEvents:pathname==='/'&&interactive?'auto':'none',opacity:pathname==='/'&&interactive?(mobile ? .18 : 1):0}}>
      <Suspense fallback={null}><Universe pathname={pathname} mobile={mobile} reducedMotion={reducedMotion} onHover={setHovered} onLeave={()=>setHovered(null)} onSelect={activate} hovered={hovered?.id??null}/></Suspense>
    </Canvas>
    {ready&&pathname==='/'&&(interactive&&showGuide&&guideExpanded?<aside className={`scene-tooltip${mobile?' is-mobile':''}${shortViewport?' is-compact':''}`} aria-label="3D navigation instructions">
      <div className="scene-tooltip-heading"><span className="scene-tooltip-icon"><Compass aria-hidden="true"/></span><span><b>HOW TO EXPLORE</b><small>{mobile?'A small map of connected ideas':'An interactive map of my work'}</small></span><button type="button" className="scene-guide-dismiss" onClick={()=>setGuideExpanded(false)} aria-label="Minimize exploration guide"><X aria-hidden="true"/></button></div>
      <div className="scene-tooltip-controls">{mobile?<>
        <div className="scene-control"><span className="scene-control-icon"><Hand aria-hidden="true"/></span><span><b>TAP A NODE</b><small>Open a section</small></span></div>
        <div className="scene-control"><span className="scene-control-icon"><MousePointerClick aria-hidden="true"/></span><span><b>MENU</b><small>Browse sections</small></span></div>
      </>:<>
        <div className="scene-control"><span className="scene-control-icon"><MousePointer2 aria-hidden="true"/></span><span><b>HOVER</b><small>Preview a section</small></span></div>
        <div className="scene-control"><span className="scene-control-icon"><MousePointerClick aria-hidden="true"/></span><span><b>CLICK</b><small>Open a section</small></span></div>
        <div className="scene-control"><span className="scene-control-icon"><Keyboard aria-hidden="true"/></span><span><b>TAB + ENTER</b><small>Navigate by keyboard</small></span></div>
      </>}</div>
      {shortViewport&&<div className="scene-tooltip-compact-guide">{mobile?<span><Hand aria-hidden="true"/> TAP A NODE · MENU FOR SECTIONS</span>:<><span><MousePointer2 aria-hidden="true"/> HOVER TO PREVIEW</span><span><MousePointerClick aria-hidden="true"/> CLICK TO OPEN</span></>}</div>}
      {hovered&&<div className="scene-tooltip-preview"><span className="scene-preview-dot"/><b>{hovered.label}</b><span>{hovered.description}</span></div>}
    </aside>:<button type="button" className="scene-guide-reopen" onClick={()=>{setGuideExpanded(true);if(window.scrollY>=48)window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});}} aria-label="Reopen 3D exploration guide"><Compass aria-hidden="true"/><span>How to explore</span></button>)}
    {pathname==='/'&&interactive&&<nav className="scene-accessible-nav" aria-label="3D universe sections">{sceneNodes.map(node=>{const [x,y]=mobile?node.hitMobile:node.hitDesktop;return <button className="scene-accessible-button" key={node.id} type="button" style={{left:`${x}%`,top:`${y}%`}} onMouseEnter={()=>setHovered(node)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(node)} onBlur={()=>setHovered(null)} onClick={()=>activate(node)} aria-label={`Open ${node.label}`}><span>{node.label}</span></button>;})}</nav>}
    {!ready&&<div className="scene-loading" role="status"><span className="scene-loader-dot"/>Loading interactive scene</div>}
  </>;
}
