import {navigation} from '@/data/profile';

const sceneContent={
  about:{description:'The story behind my journey into intelligent systems.',position:[-3.8,1.55,0] as const,mobilePosition:[-2.15,1.45,0] as const,hitDesktop:[42,37] as const,hitMobile:[23,72] as const},
  skills:{description:'Technologies and ideas I am exploring and building with.',position:[-1.55,3.05,0] as const,mobilePosition:[-0.7,2.35,0] as const,hitDesktop:[53,25] as const,hitMobile:[43,74] as const},
  projects:{description:'A timeline of products, prototypes, and experiments.',position:[1.55,3.05,0] as const,mobilePosition:[0.7,2.35,0] as const,hitDesktop:[67,25] as const,hitMobile:[62,74] as const},
  experience:{description:'Professional learning and community experience.',position:[3.8,1.55,0] as const,mobilePosition:[2.15,1.45,0] as const,hitDesktop:[78,37] as const,hitMobile:[82,72] as const},
  achievements:{description:'Programs, certifications, and learning milestones.',position:[3.8,-1.55,0] as const,mobilePosition:[2.15,-1.45,0] as const,hitDesktop:[78,63] as const,hitMobile:[82,84] as const},
  leadership:{description:'Technical community and student leadership.',position:[1.55,-3.05,0] as const,mobilePosition:[0.7,-2.35,0] as const,hitDesktop:[67,75] as const,hitMobile:[62,86] as const},
  research:{description:'Technical writing and the TestPilot academic project.',position:[-1.55,-3.05,0] as const,mobilePosition:[-0.7,-2.35,0] as const,hitDesktop:[53,75] as const,hitMobile:[43,86] as const},
  contact:{description:'Ways to connect and start a conversation.',position:[-3.8,-1.55,0] as const,mobilePosition:[-2.15,-1.45,0] as const,hitDesktop:[42,63] as const,hitMobile:[23,84] as const},
} satisfies Record<string,{description:string;position:readonly [number,number,number];mobilePosition:readonly [number,number,number];hitDesktop:readonly [number,number];hitMobile:readonly [number,number]}>

export const sceneNodes=navigation.map(item=>({...item,...sceneContent[item.id as keyof typeof sceneContent]}));
export type SceneNode=typeof sceneNodes[number];
export type ScenePosition=readonly [number,number,number];
export const sceneCenter=(mobile:boolean):ScenePosition=>mobile?[.08,-2.05,0]:[1.4,0,0];
export const scenePosition=(node:SceneNode,mobile:boolean):ScenePosition=>{
  const [x,y,z]=mobile?node.mobilePosition:node.position;
  return mobile?[x*.45+.08,y*.2-2.05,z]:[x*.65+1.4,y*.72,z];
};
