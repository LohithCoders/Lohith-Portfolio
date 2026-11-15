'use client';

import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Line,useCursor} from '@react-three/drei';
import {Compass,Hand,Keyboard,MousePointer2,MousePointerClick,X,ArrowUpRight} from 'lucide-react';
import {usePathname,useRouter} from 'next/navigation';
import {Suspense,useEffect,useMemo,useRef,useState,useCallback} from 'react';
import * as THREE from 'three';
import {sceneCenter,sceneNodes,scenePosition,type SceneNode,type ScenePosition} from '@/data/scene';
import {navigationHoverEvent,type NavigationHoverDetail} from '@/lib/navigation-events';

type SceneRuntimeProps={reducedMotion:boolean};

/* Signature Colors per Panel */
function nodeAccent(id:string){
  switch(id){
    case 'skills':      return '#C084FC'; // Brain: Lavender / Violet
    case 'projects':    return '#F97316'; // Gear: Warm Amber / Orange
    case 'about':       return '#10B981'; // Microchip: Emerald Green
    case 'experience':  return '#06B6D4'; // Layers: Cyan / Turquoise
    case 'contact':     return '#38BDF8'; // Lightning: Electric Sky Blue
    case 'achievements':return '#F59E0B'; // Infinity: Champagne Gold / Honey
    case 'research':    return '#8B5CF6'; // Code </ >: Deep Violet
    case 'leadership':  return '#EC4899'; // Growth Chart: Hot Pink / Magenta
    default:            return '#38BDF8';
  }
}

function nodeGlassColor(id:string){
  switch(id){
    case 'skills':      return '#3B1D66';
    case 'projects':    return '#5C2808';
    case 'about':       return '#0B3828';
    case 'experience':  return '#083B46';
    case 'contact':     return '#0D364A';
    case 'achievements':return '#4E3708';
    case 'research':    return '#2D1B54';
    case 'leadership':  return '#520F36';
    default:            return '#1A2E3B';
  }
}

/* ─── Descriptions from Prompt ────────────────────────────── */
const nodeDescriptions:Record<string,{title:string;description:string}> = {
  skills:      {title:'Artificial Intelligence',   description:'Exploring intelligent systems and neural computation'},
  projects:    {title:'Automation',                description:'Engineering automated workflows and intelligent processes'},
  about:       {title:'Computing Systems',          description:'Building efficient computational architectures'},
  experience:  {title:'System Architecture',       description:'Designing scalable and interconnected systems'},
  contact:     {title:'Innovation',                description:'Accelerating ideas into practical solutions'},
  achievements:{title:'Continuous Intelligence',   description:'Connecting ideas, systems and possibilities'},
  research:    {title:'Development',               description:'Building interactive software and digital products'},
  leadership:  {title:'Data Intelligence',         description:'Transforming data into meaningful insights'},
};

function routeNode(pathname:string){
  return sceneNodes.find(node=>pathname===node.href||pathname.startsWith(`${node.href}/`));
}

type Point2=readonly [number,number];
type Point3=readonly [number,number,number];

function tubeGeometry(points:readonly Point3[],radius=.01,closed=false){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)),closed,'centripetal');
  return new THREE.TubeGeometry(curve,Math.max(48,points.length*6),radius,8,closed);
}

/* ─── Truncated Icosahedron (Buckyball Soccer Sphere) ─────── */
function buildBuckyballData(radius:number){
  const phi=(1+Math.sqrt(5))/2;
  const rawVerts:number[][]=[];
  function addPerms(x:number,y:number,z:number){
    const signs=[-1,1];
    const perms=[[x,y,z],[y,z,x],[z,x,y]];
    for(const [a,b,c] of perms){
      for(const sa of (a===0?[1]:signs)){
        for(const sb of (b===0?[1]:signs)){
          for(const sc of (c===0?[1]:signs)){
            rawVerts.push([sa*a,sb*b,sc*c]);
          }
        }
      }
    }
  }
  addPerms(0,1,3*phi);
  addPerms(1,2+phi,2*phi);
  addPerms(phi,2,2*phi+1);

  const vertices:number[][]=[];
  for(const v of rawVerts){
    if(!vertices.some(u=>Math.hypot(u[0]!-v[0]!,u[1]!-v[1]!,u[2]!-v[2]!)<1e-4)){
      const len=Math.hypot(v[0]!,v[1]!,v[2]!);
      vertices.push([v[0]!/len*radius,v[1]!/len*radius,v[2]!/len*radius]);
    }
  }

  const icoCenters:number[][]=[];
  for(const [x,y,z] of [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]]){
    const l=Math.hypot(x,y,z);icoCenters.push([x/l,y/l,z/l]);
  }

  const dodCenters:number[][]=[];
  for(const x of [-1,1]){for(const y of [-1,1]){for(const z of [-1,1]){
    const l=Math.hypot(x,y,z);dodCenters.push([x/l,y/l,z/l]);
  }}}
  for(const [x,y,z] of [[0,1/phi,phi],[1/phi,phi,0],[phi,0,1/phi]]){
    for(const sx of (x===0?[1]:[-1,1])){
      for(const sy of (y===0?[1]:[-1,1])){
        for(const sz of (z===0?[1]:[-1,1])){
          const vx=sx*x,vy=sy*y,vz=sz*z,l=Math.hypot(vx,vy,vz);
          if(!dodCenters.some(u=>Math.hypot(u[0]!-vx/l,u[1]!-vy/l,u[2]!-vz/l)<1e-4)){
            dodCenters.push([vx/l,vy/l,vz/l]);
          }
        }
      }
    }
  }

  type Face={type:'pentagon'|'hexagon';center:number[];vertices:number[][]};
  const faces:Face[]=[];

  function extractFace(center:number[],count:number,type:'pentagon'|'hexagon'){
    const matched=vertices.filter(v=>{
      const dot=(v[0]!*center[0]!+v[1]!*center[1]!+v[2]!*center[2]!)/radius;
      return dot>0.88;
    });
    if(matched.length<count)return;
    const n=new THREE.Vector3(...center).normalize();
    const up=Math.abs(n.y)<0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
    const u=new THREE.Vector3().crossVectors(n,up).normalize();
    const vVec=new THREE.Vector3().crossVectors(n,u).normalize();
    matched.sort((a,b)=>{
      const va=new THREE.Vector3(...a);
      const vb=new THREE.Vector3(...b);
      const angleA=Math.atan2(va.dot(vVec),va.dot(u));
      const angleB=Math.atan2(vb.dot(vVec),vb.dot(u));
      return angleA-angleB;
    });
    faces.push({type,center,vertices:matched.slice(0,count)});
  }

  icoCenters.forEach(c=>extractFace(c,5,'pentagon'));
  dodCenters.forEach(c=>extractFace(c,6,'hexagon'));

  return {vertices,faces};
}

/* ─── 4-Point Star Glint / Sparkle ────────────────────────── */
function StarGlint({position,color='#FFFFFF',scale=0.18}:{position:Point3;color?:string;scale?:number}){
  return <group position={position} scale={scale}>
    <mesh><boxGeometry args={[1,0.08,0.02]}/><meshBasicMaterial color={color} transparent opacity={0.95}/></mesh>
    <mesh><boxGeometry args={[0.08,1,0.02]}/><meshBasicMaterial color={color} transparent opacity={0.95}/></mesh>
    <mesh><sphereGeometry args={[0.22,8,8]}/><meshBasicMaterial color={color}/></mesh>
  </group>;
}

/* ─── Central Crystalline Intelligence Orb ─────────────────── */
function CrystallineOrb({reducedMotion}:{reducedMotion:boolean}){
  const orbRadius=0.88; // Scaled to fit cleanly in viewport
  const {faces}=useMemo(()=>buildBuckyballData(orbRadius),[]);

  const groupRef=useRef<THREE.Group>(null);
  const coreRef=useRef<THREE.Mesh>(null);
  const orbitEquatorRef=useRef<THREE.Group>(null);
  const orbitChromeRef=useRef<THREE.Group>(null);

  useFrame((_,delta)=>{
    if(reducedMotion)return;
    if(groupRef.current)groupRef.current.rotation.y+=delta*0.035;
    if(coreRef.current)coreRef.current.rotation.y-=delta*0.02;
    if(orbitEquatorRef.current)orbitEquatorRef.current.rotation.z+=delta*0.025;
    if(orbitChromeRef.current)orbitChromeRef.current.rotation.y+=delta*0.018;
  });

  const glowingSeams=useMemo(()=>{
    const seams:{points:Point3[];color:string}[]=[];
    const frontFaces=[...faces].sort((a,b)=>b.center[2]!-a.center[2]!);
    const mainPentagon=frontFaces.find(f=>f.type==='pentagon')||frontFaces[0]!;
    const verts=mainPentagon.vertices;

    if(verts.length>=5){
      // Warm amber bottom seam
      seams.push({
        points:[verts[2]! as unknown as Point3,verts[3]! as unknown as Point3],
        color:'#FFB338'
      });
      // Neon violet side seams
      seams.push({
        points:[verts[3]! as unknown as Point3,verts[4]! as unknown as Point3],
        color:'#C084FC'
      });
      seams.push({
        points:[verts[4]! as unknown as Point3,verts[0]! as unknown as Point3],
        color:'#A855F7'
      });
      // Cyan top seams
      seams.push({
        points:[verts[0]! as unknown as Point3,verts[1]! as unknown as Point3],
        color:'#7DD3FC'
      });
      seams.push({
        points:[verts[1]! as unknown as Point3,verts[2]! as unknown as Point3],
        color:'#67E8F9'
      });
    }

    for(let i=1;i<Math.min(7,frontFaces.length);i++){
      const f=frontFaces[i]!;
      for(let j=0;j<f.vertices.length;j++){
        const p1=f.vertices[j]! as unknown as Point3;
        const p2=f.vertices[(j+1)%f.vertices.length]! as unknown as Point3;
        if(j%2===0){
          seams.push({points:[p1,p2],color:i%2===0?'#C084FC':'#67E8F9'});
        }
      }
    }
    return seams;
  },[faces]);

  const starGlints=useMemo(()=>{
    const frontFaces=[...faces].sort((a,b)=>b.center[2]!-a.center[2]!);
    const main=frontFaces[0]!;
    if(!main)return [];
    return [
      {pos:[main.vertices[0]![0]!*1.02,main.vertices[0]![1]!*1.02,main.vertices[0]![2]!*1.02] as Point3,color:'#FFFFFF',scale:0.25},
      {pos:[main.vertices[1]![0]!*1.02,main.vertices[1]![1]!*1.02,main.vertices[1]![2]!*1.02] as Point3,color:'#7DD3FC',scale:0.20},
      {pos:[main.vertices[2]![0]!*1.02,main.vertices[2]![1]!*1.02,main.vertices[2]![2]!*1.02] as Point3,color:'#FFA030',scale:0.22},
      {pos:[main.vertices[4]![0]!*1.02,main.vertices[4]![1]!*1.02,main.vertices[4]![2]!*1.02] as Point3,color:'#E879F9',scale:0.18},
    ];
  },[faces]);

  return <group>
    {/* Rotating Ball Group */}
    <group ref={groupRef}>
      {/* 1. Deep Dark Swirling Vortex Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[orbRadius*0.96,48,36]}/>
        <meshStandardMaterial
          color="#08091E"
          roughness={0.2}
          metalness={0.8}
          emissive="#24144A"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Inner Glowing Pupil Rings */}
      <mesh position={[0,0,0.08]}>
        <torusGeometry args={[orbRadius*0.48,0.03,16,64]}/>
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.7}/>
      </mesh>
      <mesh position={[0,0,-0.04]}>
        <torusGeometry args={[orbRadius*0.68,0.022,16,64]}/>
        <meshBasicMaterial color="#A855F7" transparent opacity={0.55}/>
      </mesh>

      {/* 2. Truncated Icosahedron Facet Panes & Beveled Frames */}
      {faces.map((face,idx)=>{
        const points=face.vertices.map(v=>new THREE.Vector3(...v));
        points.push(points[0]!.clone());
        const isFront=face.center[2]!>0.25;
        return <group key={idx}>
          <Line
            points={points}
            color={isFront?'#E2E8F0':'#64748B'}
            lineWidth={isFront?2.2:1.2}
            transparent
            opacity={isFront?0.95:0.65}
          />
        </group>;
      })}

      {/* 3. Glowing Edge Seams */}
      {glowingSeams.map((seam,idx)=>(
        <Line
          key={`seam-${idx}`}
          points={seam.points}
          color={seam.color}
          lineWidth={3.2}
          transparent
          opacity={0.98}
        />
      ))}

      {/* 4. Outer Glossy Glass Bubble Shell */}
      <mesh scale={1.02}>
        <sphereGeometry args={[orbRadius,64,48]}/>
        <meshPhysicalMaterial
          color="#BFDBFE"
          transmission={0.82}
          opacity={1}
          transparent
          roughness={0.03}
          metalness={0.08}
          ior={1.54}
          thickness={0.75}
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          envMapIntensity={2.0}
          depthWrite={false}
        />
      </mesh>

      {/* 5. Star Glints at Vertex Highlights */}
      {starGlints.map((star,idx)=>(
        <StarGlint key={idx} position={star.pos} color={star.color} scale={star.scale}/>
      ))}
    </group>

    {/* ─── ORBITAL RINGS ────────────────────────────────────── */}
    {/* Ring 1: Glowing Equatorial Ring */}
    <group ref={orbitEquatorRef} rotation={[0.26,0.38,-0.22]}>
      <mesh>
        <torusGeometry args={[1.34,0.028,18,180]}/>
        <meshStandardMaterial
          color="#C084FC"
          emissive="#A855F7"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>
      <mesh rotation={[0,Math.PI*0.85,0]}>
        <torusGeometry args={[1.345,0.029,18,90,Math.PI*0.75]}/>
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#FFA030"
          emissiveIntensity={2.8}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      {/* Necklace of Glowing Particles */}
      {Array.from({length:32},(_,i)=>{
        const a=i/32*Math.PI*2;
        const x=Math.cos(a)*1.41,y=Math.sin(a)*1.41;
        return <mesh key={i} position={[x,y,0]}>
          <sphereGeometry args={[0.018,8,8]}/>
          <meshBasicMaterial color={i<16?'#F472B6':'#C084FC'}/>
        </mesh>;
      })}
    </group>

    {/* Ring 2: Polished Silver / Chrome Vertical Ring */}
    <group ref={orbitChromeRef} rotation={[1.22,0.28,-0.42]}>
      <mesh>
        <torusGeometry args={[1.28,0.034,24,200]}/>
        <meshStandardMaterial
          color="#F8FAFC"
          emissive="#94A3B8"
          emissiveIntensity={0.35}
          metalness={0.88}
          roughness={0.1}
        />
      </mesh>
    </group>

    {/* Lights on the Orb */}
    <pointLight position={[0.3,0.3,1.4]} color="#FFFFFF" intensity={3.0} distance={7}/>
    <pointLight position={[-0.6,-0.4,0.9]} color="#FFA030" intensity={2.0} distance={5}/>
    <pointLight position={[0.5,-0.5,0.9]} color="#C084FC" intensity={2.2} distance={5}/>
    <pointLight position={[0,0.9,-0.4]} color="#38BDF8" intensity={1.5} distance={6}/>
  </group>;
}

/* ─── 8 CUSTOM 3D ICONS (SCALED FOR BALANCED VIEWPORT) ────── */
function Pure3DIconMaterial({tint='#FFFFFF'}:{tint?:string}){
  return <meshStandardMaterial
    color="#FFFFFF"
    emissive="#FFFFFF"
    emissiveIntensity={2.4}
    roughness={0.12}
    metalness={0.2}
  />;
}

// 1. Brain / Neural Network 3D
const brainLobeLeft:Point3[]=[
  [0,0.22,0.08],[-0.08,0.24,0.08],[-0.16,0.2,0.08],[-0.22,0.12,0.08],
  [-0.22,0.02,0.08],[-0.24,-0.06,0.08],[-0.2,-0.15,0.08],[-0.1,-0.21,0.08],[0,-0.2,0.08]
];
const brainLobeRight:Point3[]=brainLobeLeft.map(([x,y,z])=>[-x,y,z]);
function Brain3D({color}:{color:string}){
  const leftGeo=useMemo(()=>tubeGeometry(brainLobeLeft,0.016),[]);
  const rightGeo=useMemo(()=>tubeGeometry(brainLobeRight,0.016),[]);
  return <group>
    <mesh geometry={leftGeo}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh geometry={rightGeo}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[0,0.01,0.08]}><boxGeometry args={[0.018,0.41,0.02]}/><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[-0.1,0.09,0.09]}><torusGeometry args={[0.055,0.012,8,24,Math.PI*1.4]}/><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[-0.1,-0.07,0.09]}><torusGeometry args={[0.055,0.012,8,24,Math.PI*1.4]}/><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[0.1,0.09,0.09]} rotation={[0,0,Math.PI*0.6]}><torusGeometry args={[0.055,0.012,8,24,Math.PI*1.4]}/><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[0.1,-0.07,0.09]} rotation={[0,0,Math.PI*0.6]}><torusGeometry args={[0.055,0.012,8,24,Math.PI*1.4]}/><Pure3DIconMaterial tint={color}/></mesh>
    {[-0.08,0.08].map(x=>[-0.12,0.02,0.14].map(y=><mesh key={`${x}-${y}`} position={[x,y,0.09]}><sphereGeometry args={[0.018,8,8]}/><Pure3DIconMaterial tint={color}/></mesh>))}
  </group>;
}

// 2. Mechanical Gear 3D
function gearShape(){
  const teeth=10,step=Math.PI*2/teeth,shape=new THREE.Shape();
  let first=true;
  for(let i=0;i<teeth;i++){
    for(const [fraction,radius] of [[0,0.15],[0.1,0.15],[0.15,0.23],[0.42,0.23],[0.47,0.15],[0.9,0.15]] as const){
      const a=(i+fraction)*step,x=Math.cos(a)*radius,y=Math.sin(a)*radius;
      if(first){shape.moveTo(x,y);first=false;}else shape.lineTo(x,y);
    }
  }
  shape.closePath();
  const hole=new THREE.Path();hole.absarc(0,0,0.072,0,Math.PI*2,true);shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape,{depth:0.045,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:0.008,bevelThickness:0.008});
}
function Gear3D({color}:{color:string}){
  const geo=useMemo(()=>gearShape(),[]);
  return <group>
    <mesh geometry={geo} position={[0,0,0.07]}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[0,0,0.15]}><torusGeometry args={[0.088,0.014,8,48]}/><Pure3DIconMaterial tint={color}/></mesh>
  </group>;
}

// 3. Microchip / Processor 3D
function Microchip3D({color}:{color:string}){
  const pinOffsets=[-0.12,-0.04,0.04,0.12];
  return <group>
    <mesh position={[0,0,0.08]}><boxGeometry args={[0.23,0.23,0.05]}/><Pure3DIconMaterial tint={color}/></mesh>
    <mesh position={[0,0,0.12]}><boxGeometry args={[0.13,0.13,0.024]}/><meshStandardMaterial color="#0A2218" emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.6}/></mesh>
    <mesh position={[0,0,0.14]}><boxGeometry args={[0.07,0.07,0.015]}/><Pure3DIconMaterial tint={color}/></mesh>
    {pinOffsets.flatMap(v=><group key={v}>
      <mesh position={[v,0.18,0.08]}><boxGeometry args={[0.026,0.085,0.032]}/><Pure3DIconMaterial tint={color}/></mesh>
      <mesh position={[v,-0.18,0.08]}><boxGeometry args={[0.026,0.085,0.032]}/><Pure3DIconMaterial tint={color}/></mesh>
      <mesh position={[0.18,v,0.08]}><boxGeometry args={[0.085,0.026,0.032]}/><Pure3DIconMaterial tint={color}/></mesh>
      <mesh position={[-0.18,v,0.08]}><boxGeometry args={[0.085,0.026,0.032]}/><Pure3DIconMaterial tint={color}/></mesh>
    </group>)}
  </group>;
}

// 4. Layered Architecture 3D
const diamondShape:Point2[]=[[-0.21,0],[0,0.125],[0.21,0],[0,-0.125]];
function diamondExtrude(depth=0.035){
  const shape=new THREE.Shape();
  shape.moveTo(diamondShape[0]![0],diamondShape[0]![1]);
  for(const [x,y] of diamondShape.slice(1))shape.lineTo(x,y);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.008,bevelThickness:0.008});
}
function Layers3D({color}:{color:string}){
  const geo=useMemo(()=>diamondExtrude(),[]);
  return <group>
    {[-0.11,0,0.11].map((y,i)=>(
      <mesh key={i} geometry={geo} position={[0,y,0.06+i*0.035]}>
        <Pure3DIconMaterial tint={color}/>
      </mesh>
    ))}
  </group>;
}

// 5. Lightning Bolt 3D
const boltPts:Point2[]=[[-0.025,0.24],[0.17,0.01],[0.055,0.01],[0.115,-0.23],[-0.17,0.045],[-0.055,0.045]];
function boltExtrude(){
  const shape=new THREE.Shape();
  shape.moveTo(boltPts[0]![0],boltPts[0]![1]);
  for(const [x,y] of boltPts.slice(1))shape.lineTo(x,y);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:0.065,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:0.01,bevelThickness:0.01});
}
function Lightning3D({color}:{color:string}){
  const geo=useMemo(()=>boltExtrude(),[]);
  return <mesh geometry={geo} position={[0,0,0.07]}><Pure3DIconMaterial tint={color}/></mesh>;
}

// 6. Infinity Symbol 3D
const infinityCurvePts:Point3[]=Array.from({length:96},(_,i)=>{
  const t=i/95*Math.PI*2,denom=1+Math.cos(t)**2;
  return [0.26*Math.sin(t)/denom,0.26*Math.sin(t)*Math.cos(t)/denom,0.08+0.022*Math.sin(2*t)];
});
function Infinity3D({color}:{color:string}){
  const geo=useMemo(()=>tubeGeometry(infinityCurvePts,0.034,true),[]);
  return <mesh geometry={geo}><Pure3DIconMaterial tint={color}/></mesh>;
}

// 7. Code Brackets </> 3D
const bracketLeftPts:Point3[]=[[-0.045,0.2,0.08],[-0.22,0,0.08],[-0.045,-0.2,0.08]];
const bracketRightPts:Point3[]=[[0.045,0.2,0.08],[0.22,0,0.08],[0.045,-0.2,0.08]];
const slashPts:Point3[]=[[0.085,0.22,0.08],[0,0,0.08],[-0.085,-0.22,0.08]];
function CodeBrackets3D({color}:{color:string}){
  const geoL=useMemo(()=>tubeGeometry(bracketLeftPts,0.026),[]);
  const geoR=useMemo(()=>tubeGeometry(bracketRightPts,0.026),[]);
  const geoS=useMemo(()=>tubeGeometry(slashPts,0.022),[]);
  return <group>
    <mesh geometry={geoL}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh geometry={geoR}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh geometry={geoS}><Pure3DIconMaterial tint={color}/></mesh>
  </group>;
}

// 8. Analytics / Growth Chart 3D
const arrowPts:Point3[]=[[-0.22,0.08,0.1],[-0.09,0.17,0.1],[0.02,0.13,0.1],[0.22,0.3,0.1]];
const arrowHeadPts:Point3[]=[[0.12,0.29,0.1],[0.22,0.3,0.1],[0.19,0.21,0.1]];
function GrowthChart3D({color}:{color:string}){
  const geoArrow=useMemo(()=>tubeGeometry(arrowPts,0.014),[]);
  const geoHead=useMemo(()=>tubeGeometry(arrowHeadPts,0.014),[]);
  return <group>
    {[0.1,0.19,0.28,0.37].map((h,i)=>(
      <mesh key={h} position={[-0.18+i*0.12,-0.12+h/2,0.08]}>
        <boxGeometry args={[0.078,h,0.072]}/>
        <Pure3DIconMaterial tint={color}/>
      </mesh>
    ))}
    <mesh geometry={geoArrow}><Pure3DIconMaterial tint={color}/></mesh>
    <mesh geometry={geoHead}><Pure3DIconMaterial tint={color}/></mesh>
  </group>;
}

function RenderIcon({id,color}:{id:string;color:string}){
  switch(id){
    case 'skills':      return <Brain3D color={color}/>;
    case 'projects':    return <Gear3D color={color}/>;
    case 'about':       return <Microchip3D color={color}/>;
    case 'experience':  return <Layers3D color={color}/>;
    case 'contact':     return <Lightning3D color={color}/>;
    case 'achievements':return <Infinity3D color={color}/>;
    case 'research':    return <CodeBrackets3D color={color}/>;
    default:            return <GrowthChart3D color={color}/>;
  }
}

/* ─── Pointy-Topped Hexagon Geometry (R=0.38) ─────────────── */
function makePointyHexShape(radius=0.38){
  const s=new THREE.Shape();
  for(let i=0;i<6;i++){
    const angle=(i*60+90)*Math.PI/180;
    const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
    if(i===0)s.moveTo(x,y);else shapeLineTo(s,x,y);
  }
  s.closePath();
  return s;
}
function shapeLineTo(s:THREE.Shape,x:number,y:number){s.lineTo(x,y);}

function makePointyHexLinePoints(radius=0.38,z=0.06):[number,number,number][]{
  const pts:[number,number,number][]=[];
  for(let i=0;i<=6;i++){
    const angle=(i*60+90)*Math.PI/180;
    pts.push([Math.cos(angle)*radius,Math.sin(angle)*radius,z]);
  }
  return pts;
}

/* ─── Floating Hexagonal Glass Panel Component ───────────── */
function FloatingHexPanel({
  node,position,active,selected,hovered,reducedMotion,onHover,onLeave,onSelect
}:{
  node:SceneNode;position:ScenePosition;active:boolean;selected:boolean;hovered:boolean;reducedMotion:boolean;
  onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void;
}){
  const groupRef=useRef<THREE.Group>(null);
  const accent=nodeAccent(node.id);
  const glassColor=nodeGlassColor(node.id);

  const glassGeo=useMemo(()=>{
    const shape=makePointyHexShape(0.38);
    return new THREE.ExtrudeGeometry(shape,{
      depth:0.085,
      bevelEnabled:true,
      bevelSegments:4,
      steps:1,
      bevelSize:0.018,
      bevelThickness:0.018,
    });
  },[]);

  const neonRimPoints=useMemo(()=>makePointyHexLinePoints(0.395,0.055),[]);
  const innerRimPoints=useMemo(()=>makePointyHexLinePoints(0.34,0.058),[]);

  useCursor(hovered);

  useFrame(({clock},delta)=>{
    if(!groupRef.current)return;
    const baseScale=selected?1.22:active?1.12:1.0;
    const cur=groupRef.current.scale.x;
    const speed=reducedMotion?1:Math.min(1,delta*8);
    groupRef.current.scale.setScalar(cur+(baseScale-cur)*speed);

    if(!reducedMotion){
      const t=clock.getElapsedTime()+node.id.length;
      groupRef.current.position.y=position[1]+Math.sin(t*1.2)*0.025;
      groupRef.current.position.z=position[2]+Math.cos(t*1.1)*0.015;
    }
  });

  return <group
    ref={groupRef}
    position={position}
    onPointerOver={e=>{e.stopPropagation();onHover(node);}}
    onPointerOut={e=>{e.stopPropagation();onLeave();}}
    onClick={e=>{e.stopPropagation();onSelect(node);}}
  >
    {/* 1. Thick Beveled Translucent Glass Body */}
    <mesh geometry={glassGeo} position={[0,0,-0.06]}>
      <meshPhysicalMaterial
        color={glassColor}
        emissive={accent}
        emissiveIntensity={selected?0.48:active?0.32:0.16}
        transparent
        opacity={selected?0.68:active?0.56:0.46}
        roughness={0.05}
        metalness={0.2}
        clearcoat={1.0}
        clearcoatRoughness={0.02}
        transmission={0.65}
        ior={1.52}
        thickness={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>

    {/* 2. Intense Glowing Neon Bevel Border */}
    <Line
      points={neonRimPoints}
      color={selected?'#FFFFFF':accent}
      lineWidth={selected?3.4:active?2.8:2.0}
      transparent
      opacity={selected?1.0:active?0.95:0.88}
    />

    {/* 3. Subtle Inner Specular Rim */}
    <Line
      points={innerRimPoints}
      color="#FFFFFF"
      lineWidth={0.8}
      transparent
      opacity={selected?0.65:active?0.4:0.22}
    />

    {/* 4. White Luminescent 3D Icon (scaled 0.7 to fit hexagon) */}
    <group scale={0.7} position={[0,0,0.015]}>
      <RenderIcon id={node.id} color={accent}/>
    </group>

    {/* 5. Ambient Glow Sphere */}
    <mesh scale={0.65}>
      <sphereGeometry args={[0.52,24,16]}/>
      <meshBasicMaterial color={accent} transparent opacity={selected?0.2:active?0.12:0.055} depthWrite={false}/>
    </mesh>

    {/* 6. Glowing Connector Bead at the Apex */}
    <mesh position={[0,node.id==='skills'||node.id==='projects'?-0.4:node.id==='research'||node.id==='leadership'?0.4:0,0]}>
      <sphereGeometry args={[0.035,12,12]}/>
      <meshBasicMaterial color="#FFFFFF"/>
    </mesh>
  </group>;
}

/* ─── Connecting Laser Beams with Visible Luminous Lasers ── */
function ConnectingLaserBeams({
  mobile,highlight,selected
}:{
  mobile:boolean;highlight:string|null;selected:string|null;
}){
  const center=sceneCenter(mobile);
  const centerVec=new THREE.Vector3(...center);

  return <group>{sceneNodes.map(node=>{
    const pos=scenePosition(node,mobile);
    const posVec=new THREE.Vector3(...pos);
    const isActive=highlight===node.id||selected===node.id;
    const accent=nodeAccent(node.id);

    let attachOffset=new THREE.Vector3(0,0,0);
    if(node.id==='skills'||node.id==='projects'){
      attachOffset.set(0,-0.4,0);
    }else if(node.id==='research'||node.id==='leadership'){
      attachOffset.set(0,0.4,0);
    }else if(node.id==='about'||node.id==='contact'){
      attachOffset.set(0.35,0,0);
    }else{
      attachOffset.set(-0.35,0,0);
    }
    const fromPt=posVec.clone().add(attachOffset);
    const dir=fromPt.clone().sub(centerVec).normalize();
    const toPt=centerVec.clone().add(dir.clone().multiplyScalar(0.88));

    return <group key={node.id}>
      <Line
        points={[[fromPt.x,fromPt.y,fromPt.z],[toPt.x,toPt.y,toPt.z]]}
        color={isActive?'#FFFFFF':'#818CF8'}
        lineWidth={isActive?2.4:1.4}
        transparent
        opacity={isActive?1.0:0.85}
      />
      <Line
        points={[[fromPt.x,fromPt.y,fromPt.z],[toPt.x,toPt.y,toPt.z]]}
        color={accent}
        lineWidth={isActive?4.8:2.8}
        transparent
        opacity={isActive?0.65:0.35}
      />
      <LaserPulse from={fromPt} to={toPt} color={accent} speed={isActive?2.2:1.4} offset={0}/>
      <LaserPulse from={fromPt} to={toPt} color="#FFFFFF" speed={isActive?2.2:1.4} offset={0.5}/>
    </group>;
  })}</group>;
}

function LaserPulse({from,to,color,speed,offset}:{from:THREE.Vector3;to:THREE.Vector3;color:string;speed:number;offset:number}){
  const ref=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{
    if(!ref.current)return;
    const t=((clock.getElapsedTime()*speed+offset)%1);
    ref.current.position.lerpVectors(from,to,t);
  });
  return <mesh ref={ref}>
    <sphereGeometry args={[0.032,8,8]}/>
    <meshBasicMaterial color={color}/>
  </mesh>;
}

/* ─── Holographic Platform (Studio Floor Below Orb) ──────── */
function HolographicPlatform({mobile}:{mobile:boolean}){
  const ticks=useMemo(()=>{
    const values:number[]=[];
    for(let i=0;i<96;i++){
      const a=i/96*Math.PI*2;
      const rInner=1.4,rOuter=i%4===0?1.52:i%2===0?1.48:1.44;
      values.push(Math.cos(a)*rInner,Math.sin(a)*rInner,0,Math.cos(a)*rOuter,Math.sin(a)*rOuter,0);
    }
    return new Float32Array(values);
  },[]);

  const radials=useMemo(()=>{
    const values:number[]=[];
    for(let i=0;i<16;i++){
      const a=i/16*Math.PI*2;
      values.push(0,0,0,Math.cos(a)*1.9,Math.sin(a)*1.9,0);
    }
    return new Float32Array(values);
  },[]);

  const rotRef=useRef<THREE.Group>(null);
  useFrame((_,delta)=>{
    if(rotRef.current)rotRef.current.rotation.z+=delta*0.04;
  });

  return <group position={[0,-1.95,-0.4]} rotation={[-Math.PI/2.3,0,0]} scale={mobile?0.5:0.72}>
    {/* Floor Reflection Light Puddles */}
    <mesh position={[-1.05,-0.9,0.01]}>
      <circleGeometry args={[0.55,32]}/>
      <meshBasicMaterial color="#8B5CF6" transparent opacity={0.18} depthWrite={false}/>
    </mesh>
    <mesh position={[1.05,-0.9,0.01]}>
      <circleGeometry args={[0.55,32]}/>
      <meshBasicMaterial color="#EC4899" transparent opacity={0.2} depthWrite={false}/>
    </mesh>
    <mesh position={[-1.75,0.3,0.01]}>
      <circleGeometry args={[0.65,32]}/>
      <meshBasicMaterial color="#06B6D4" transparent opacity={0.16} depthWrite={false}/>
    </mesh>
    <mesh position={[1.75,0.3,0.01]}>
      <circleGeometry args={[0.65,32]}/>
      <meshBasicMaterial color="#F59E0B" transparent opacity={0.16} depthWrite={false}/>
    </mesh>
    <mesh position={[0,0,0.01]}>
      <circleGeometry args={[0.95,48]}/>
      <meshBasicMaterial color="#38BDF8" transparent opacity={0.14} depthWrite={false}/>
    </mesh>

    {/* Concentric Cybernetic Rings */}
    {[0.85,1.12,1.42,1.72,2.02,2.32].map((r,i)=>(
      <mesh key={r}>
        <torusGeometry args={[r,i===2?0.012:0.007,8,180]}/>
        <meshBasicMaterial
          color={i%2===0?'#38BDF8':'#A855F7'}
          transparent
          opacity={i===1?0.55:i===2?0.75:0.4}
        />
      </mesh>
    ))}

    {/* Segmented Rotating Track */}
    <group ref={rotRef}>
      <mesh>
        <torusGeometry args={[1.58,0.014,8,64,Math.PI*0.4]}/>
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.85}/>
      </mesh>
      <mesh rotation={[0,0,Math.PI*0.7]}>
        <torusGeometry args={[1.58,0.014,8,64,Math.PI*0.4]}/>
        <meshBasicMaterial color="#A855F7" transparent opacity={0.85}/>
      </mesh>
      <mesh rotation={[0,0,Math.PI*1.4]}>
        <torusGeometry args={[1.58,0.014,8,64,Math.PI*0.3]}/>
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.75}/>
      </mesh>
    </group>

    {/* Radial Tick Marks */}
    <lineSegments>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[ticks,3]}/></bufferGeometry>
      <lineBasicMaterial color="#38BDF8" transparent opacity={0.6}/>
    </lineSegments>

    {/* Radial Spokes */}
    <lineSegments>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[radials,3]}/></bufferGeometry>
      <lineBasicMaterial color="#E2E8F0" transparent opacity={0.22}/>
    </lineSegments>
  </group>;
}

/* ─── Atmospheric Floating Dust Particles ─────────────────── */
function AtmosphericDust({mobile,reducedMotion}:{mobile:boolean;reducedMotion:boolean}){
  const ref=useRef<THREE.Points>(null);
  const positions=useMemo(()=>{
    const count=mobile?140:420;
    const values=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const t=i*2.399963229728653;
      const radius=2.4+((i*37)%100)/100*4.0;
      values[i*3]=Math.cos(t)*radius;
      values[i*3+1]=Math.sin(t)*radius*0.65;
      values[i*3+2]=((i*19)%100)/10-4.0;
    }
    return values;
  },[mobile]);

  useFrame((_,delta)=>{
    if(!reducedMotion&&ref.current)ref.current.rotation.z+=delta*0.0025;
  });

  return <points ref={ref} position={sceneCenter(mobile)}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color="#C084FC" size={mobile?0.012:0.018} transparent opacity={0.35} sizeAttenuation depthWrite={false}/>
  </points>;
}

/* ─── Camera Movement & Mouse Drag-to-Rotate ─────────────── */
function InteractiveUniverse({
  pathname,mobile,reducedMotion,onHover,onLeave,onSelect,hovered,selected
}:{
  pathname:string;mobile:boolean;reducedMotion:boolean;
  onHover:(node:SceneNode)=>void;onLeave:()=>void;onSelect:(node:SceneNode)=>void;
  hovered:string|null;selected:string|null;
}){
  const {gl}=useThree();
  const current=routeNode(pathname)?.id??null;
  const isDragging=useRef(false);
  const prevMouse=useRef({x:0,y:0});
  const rotationOffset=useRef({x:0,y:0});
  const velocity=useRef({x:0,y:0});

  useEffect(()=>{
    const dom=gl.domElement;
    const onDown=(e:PointerEvent)=>{
      if(e.button!==0)return;
      isDragging.current=true;
      prevMouse.current={x:e.clientX,y:e.clientY};
    };
    const onMove=(e:PointerEvent)=>{
      if(!isDragging.current)return;
      const dx=e.clientX-prevMouse.current.x;
      const dy=e.clientY-prevMouse.current.y;
      prevMouse.current={x:e.clientX,y:e.clientY};
      velocity.current={x:dx*0.004,y:dy*0.004};
      rotationOffset.current.y+=velocity.current.x;
      rotationOffset.current.x=Math.max(-0.4,Math.min(0.4,rotationOffset.current.x+velocity.current.y));
    };
    const onUp=()=>{isDragging.current=false;};

    dom.addEventListener('pointerdown',onDown);
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp);
    return()=>{
      dom.removeEventListener('pointerdown',onDown);
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('pointerup',onUp);
    };
  },[gl]);

  useFrame((_,delta)=>{
    if(!isDragging.current){
      velocity.current.x*=0.94;
      velocity.current.y*=0.94;
      rotationOffset.current.y+=velocity.current.x;
      rotationOffset.current.x+=velocity.current.y;
      rotationOffset.current.x+=(0-rotationOffset.current.x)*delta*0.8;
    }
  });

  const center=sceneCenter(mobile);

  return <>
    <fog attach="fog" args={['#F5F3EF',16,36]}/>
    <ambientLight intensity={1.15} color="#FFF8F2"/>
    <directionalLight position={[-4,5,7]} color="#FDE68A" intensity={2.8}/>
    <pointLight position={[center[0]+2.5,-1,3.0]} color="#C084FC" intensity={2.0} distance={16}/>
    <pointLight position={[center[0]-2.5,2,2.0]} color="#38BDF8" intensity={1.6} distance={14}/>
    <pointLight position={[center[0],-2.0,1.8]} color="#FFA030" intensity={1.2} distance={10}/>

    <group
      position={[center[0],center[1],center[2]]}
      rotation={[rotationOffset.current.x,rotationOffset.current.y,0]}
    >
      <group position={[-center[0],-center[1],-center[2]]}>
        {/* Central Orb & Orbital Rings */}
        <group position={center}>
          <CrystallineOrb reducedMotion={reducedMotion}/>
          <HolographicPlatform mobile={mobile}/>
        </group>

        {/* 8 Connecting Light Beams */}
        <ConnectingLaserBeams mobile={mobile} highlight={hovered} selected={selected}/>

        {/* 8 Floating Hexagonal Glass Panels */}
        {sceneNodes.map(node=>(
          <FloatingHexPanel
            key={node.id}
            node={node}
            position={scenePosition(node,mobile)}
            active={hovered===node.id||current===node.id}
            selected={selected===node.id}
            hovered={hovered===node.id}
            reducedMotion={reducedMotion}
            onHover={onHover}
            onLeave={onLeave}
            onSelect={onSelect}
          />
        ))}

        {/* Floating Atmospheric Dust Sparks */}
        <AtmosphericDust mobile={mobile} reducedMotion={reducedMotion}/>
      </group>
    </group>
  </>;
}

/* ─── Interactive Floating Info Card Component ────────────── */
function InfoCard({node,onClose}:{node:SceneNode;onClose:()=>void}){
  const info=nodeDescriptions[node.id]??{title:node.label,description:''};
  const accent=nodeAccent(node.id);

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[onClose]);

  return <div className="scene-info-card" style={{'--accent':accent} as React.CSSProperties}>
    <button className="scene-info-close" onClick={onClose} aria-label="Close information card">
      <X size={15}/>
    </button>
    <span className="scene-info-label">{node.label.toUpperCase()}</span>
    <strong className="scene-info-title">{info.title}</strong>
    <p className="scene-info-desc">{info.description}</p>
    <a className="scene-info-link" href={node.href}>
      Explore section <ArrowUpRight size={13} aria-hidden="true"/>
    </a>
  </div>;
}

/* ─── Root SceneRuntime Export ────────────────────────────── */
export function SceneRuntime({reducedMotion}:SceneRuntimeProps){
  const pathname=usePathname();
  const [mobile,setMobile]=useState(false);
  const [visible,setVisible]=useState(true);
  const [interactive,setInteractive]=useState(pathname==='/');
  const [hovered,setHovered]=useState<SceneNode|null>(null);
  const [selected,setSelected]=useState<SceneNode|null>(null);
  const [ready,setReady]=useState(false);
  const [shortViewport,setShortViewport]=useState(false);
  const [showGuide,setShowGuide]=useState(pathname==='/');
  const [guideExpanded,setGuideExpanded]=useState(true);

  useEffect(()=>{
    window.dispatchEvent(new CustomEvent<NavigationHoverDetail>(navigationHoverEvent,{detail:hovered?.id??null}));
  },[hovered]);

  useEffect(()=>{
    const q=window.matchMedia('(max-width: 767px)');
    const u=()=>setMobile(q.matches);
    u();
    q.addEventListener('change',u);
    return()=>q.removeEventListener('change',u);
  },[]);

  useEffect(()=>{
    const q=window.matchMedia('(max-height: 720px)');
    const u=()=>setShortViewport(q.matches);
    u();
    q.addEventListener('change',u);
    return()=>q.removeEventListener('change',u);
  },[]);

  useEffect(()=>{
    const root=document.querySelector('.scene-shell');
    if(!root)return;
    const obs=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting===true&&document.visibilityState==='visible'));
    obs.observe(root);
    const onVis=()=>setVisible(document.visibilityState==='visible');
    document.addEventListener('visibilitychange',onVis);
    return()=>{obs.disconnect();document.removeEventListener('visibilitychange',onVis);};
  },[]);

  useEffect(()=>{
    const update=()=>{
      setInteractive(pathname==='/'&&window.scrollY<window.innerHeight*0.82);
      setShowGuide(pathname==='/'&&window.scrollY<48);
    };
    update();
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[pathname]);

  useEffect(()=>{setSelected(null);},[pathname]);

  const handleHover=useCallback((node:SceneNode)=>setHovered(node),[]);
  const handleLeave=useCallback(()=>setHovered(null),[]);
  const handleSelect=useCallback((node:SceneNode)=>{
    setHovered(null);
    setSelected(prev=>prev?.id===node.id?null:node);
  },[]);
  const handleCanvasClick=useCallback(()=>setSelected(null),[]);

  return <>
    <Canvas
      className="scene-canvas"
      aria-hidden="true"
      camera={{position:[0,0,10.6],fov:44}}
      dpr={mobile?[1,1.15]:[1,1.5]}
      frameloop={!visible?'never':reducedMotion||pathname!=='/'||!interactive?'demand':'always'}
      gl={{alpha:true,antialias:true,powerPreference:'high-performance'}}
      onCreated={()=>setReady(true)}
      onClick={handleCanvasClick}
      fallback={<div className="scene-fallback-art"><span>LR</span><i/><b>INTERACTIVE SCENE UNAVAILABLE</b></div>}
      style={{
        pointerEvents:pathname==='/'&&interactive?'auto':'none',
        opacity:pathname==='/'&&interactive?(mobile?0.22:1):0
      }}
    >
      <Suspense fallback={null}>
        <InteractiveUniverse
          pathname={pathname}
          mobile={mobile}
          reducedMotion={reducedMotion}
          onHover={handleHover}
          onLeave={handleLeave}
          onSelect={handleSelect}
          hovered={hovered?.id??null}
          selected={selected?.id??null}
        />
      </Suspense>
    </Canvas>

    {/* Floating Information Card */}
    {ready&&pathname==='/'&&interactive&&selected&&(
      <InfoCard node={selected} onClose={()=>setSelected(null)}/>
    )}

    {/* Exploration Guide */}
    {ready&&pathname==='/'&&(interactive&&showGuide&&guideExpanded
      ?<aside className={`scene-tooltip${mobile?' is-mobile':''}${shortViewport?' is-compact':''}`} aria-label="3D navigation instructions">
        <div className="scene-tooltip-heading">
          <span className="scene-tooltip-icon"><Compass aria-hidden="true"/></span>
          <span><b>HOW TO EXPLORE</b><small>{mobile?'Tap a node or drag to rotate':'Hover to preview · Click for details'}</small></span>
          <button type="button" className="scene-guide-dismiss" onClick={()=>setGuideExpanded(false)} aria-label="Minimize exploration guide"><X aria-hidden="true"/></button>
        </div>
        <div className="scene-tooltip-controls">{mobile?<>
          <div className="scene-control"><span className="scene-control-icon"><Hand aria-hidden="true"/></span><span><b>TAP A NODE</b><small>View details</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><MousePointerClick aria-hidden="true"/></span><span><b>MENU</b><small>Browse sections</small></span></div>
        </>:<>
          <div className="scene-control"><span className="scene-control-icon"><MousePointer2 aria-hidden="true"/></span><span><b>HOVER</b><small>Preview node</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><MousePointerClick aria-hidden="true"/></span><span><b>CLICK</b><small>Open info card</small></span></div>
          <div className="scene-control"><span className="scene-control-icon"><Keyboard aria-hidden="true"/></span><span><b>TAB + ENTER</b><small>Keyboard nav</small></span></div>
        </>}</div>
        {shortViewport&&<div className="scene-tooltip-compact-guide">{mobile?<span><Hand aria-hidden="true"/> TAP NODE · DRAG TO ROTATE</span>:<><span><MousePointer2 aria-hidden="true"/> HOVER TO PREVIEW</span><span><MousePointerClick aria-hidden="true"/> CLICK FOR INFO</span></>}</div>}
        {hovered&&<div className="scene-tooltip-preview"><span className="scene-preview-dot"/><b>{hovered.label}</b><span>{hovered.description}</span></div>}
      </aside>
      :<button type="button" className="scene-guide-reopen" onClick={()=>{setGuideExpanded(true);if(window.scrollY>=48)window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});}} aria-label="Reopen 3D exploration guide">
        <Compass aria-hidden="true"/><span>How to explore</span>
      </button>
    )}

    {/* Accessible overlay buttons */}
    {pathname==='/'&&interactive&&<nav className="scene-accessible-nav" aria-label="3D universe sections">
      {sceneNodes.map(node=>{
        const [x,y]=mobile?node.hitMobile:node.hitDesktop;
        return <button
          className="scene-accessible-button"
          data-node-id={node.id}
          key={node.id}
          type="button"
          style={{left:`${x}%`,top:`${y}%`}}
          onMouseEnter={()=>setHovered(node)}
          onMouseLeave={()=>setHovered(null)}
          onFocus={()=>setHovered(node)}
          onBlur={()=>setHovered(null)}
          onClick={()=>handleSelect(node)}
          aria-label={`Open ${node.label}`}
        ><span>{node.label}</span></button>;
      })}
    </nav>}

    {!ready&&<div className="scene-loading" role="status"><span className="scene-loader-dot"/>Loading interactive scene</div>}
  </>;
}
