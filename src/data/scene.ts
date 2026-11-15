import {navigation} from '@/data/profile';

/**
 * 8 Radial Panels matching the exact layout of the AI Intelligence Core reference image:
 * Proportioned to fit cleanly within the 680x680 viewport on the right side of the homepage,
 * with zero overlap onto hero text or navigation.
 *
 * - Upper-Left:  Brain / Neural Network (skills)
 * - Upper-Right: Mechanical Gear (projects)
 * - Mid-Left:    Microchip / Processor (about)
 * - Mid-Right:   Layered Architecture (experience)
 * - Low-Left:    Lightning Bolt (contact)
 * - Low-Right:   Infinity Symbol (achievements)
 * - Bottom-Left: Code Brackets </> (research)
 * - Bottom-Right:Analytics / Growth Chart (leadership)
 */
const sceneContent = {
  skills: {
    description: 'Artificial Intelligence: Exploring intelligent systems and neural computation.',
    position: [-1.25, 2.05, 0.08] as const,
    mobilePosition: [-0.95, 1.45, 0.05] as const,
    hitDesktop: [62, 18] as const,
    hitMobile: [32, 68] as const,
  },
  projects: {
    description: 'Automation: Engineering automated workflows and intelligent processes.',
    position: [1.25, 2.05, 0.08] as const,
    mobilePosition: [0.95, 1.45, 0.05] as const,
    hitDesktop: [84, 18] as const,
    hitMobile: [68, 68] as const,
  },
  about: {
    description: 'Computing Systems: Building efficient computational architectures.',
    position: [-2.55, 0.85, 0.05] as const,
    mobilePosition: [-1.75, 0.55, 0.03] as const,
    hitDesktop: [52, 38] as const,
    hitMobile: [18, 77] as const,
  },
  experience: {
    description: 'System Architecture: Designing scalable and interconnected systems.',
    position: [2.55, 0.85, 0.05] as const,
    mobilePosition: [1.75, 0.55, 0.03] as const,
    hitDesktop: [94, 38] as const,
    hitMobile: [82, 77] as const,
  },
  contact: {
    description: 'Innovation: Accelerating ideas into practical solutions.',
    position: [-2.55, -0.65, 0.05] as const,
    mobilePosition: [-1.75, -0.45, 0.03] as const,
    hitDesktop: [52, 60] as const,
    hitMobile: [18, 86] as const,
  },
  achievements: {
    description: 'Continuous Intelligence: Connecting ideas, systems and possibilities.',
    position: [2.55, -0.65, 0.05] as const,
    mobilePosition: [1.75, -0.45, 0.03] as const,
    hitDesktop: [94, 60] as const,
    hitMobile: [82, 86] as const,
  },
  research: {
    description: 'Development: Building interactive software and digital products.',
    position: [-1.05, -1.85, 0.1] as const,
    mobilePosition: [-0.75, -1.35, 0.06] as const,
    hitDesktop: [64, 80] as const,
    hitMobile: [35, 93] as const,
  },
  leadership: {
    description: 'Data Intelligence: Transforming data into meaningful insights.',
    position: [1.05, -1.85, 0.1] as const,
    mobilePosition: [0.75, -1.35, 0.06] as const,
    hitDesktop: [82, 80] as const,
    hitMobile: [65, 93] as const,
  },
} satisfies Record<string, {
  description: string;
  position: readonly [number, number, number];
  mobilePosition: readonly [number, number, number];
  hitDesktop: readonly [number, number];
  hitMobile: readonly [number, number];
}>;

export const sceneNodes = navigation.map(item => ({
  ...item,
  ...sceneContent[item.id as keyof typeof sceneContent],
}));

export type SceneNode = typeof sceneNodes[number];
export type ScenePosition = readonly [number, number, number];

// Desktop center shifted right to [2.25, 0.05, 0] so it lives entirely in the right hero column
export const sceneCenter = (mobile: boolean): ScenePosition => mobile ? [0.05, -1.85, 0] : [2.25, 0.05, 0];

export const scenePosition = (node: SceneNode, mobile: boolean): ScenePosition => {
  const [x, y, z] = mobile ? node.mobilePosition : node.position;
  const [centerX, centerY, centerZ] = sceneCenter(mobile);
  return [x + centerX, y + centerY, z + centerZ];
};
