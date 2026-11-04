import type {MetadataRoute} from 'next';import {projects} from '@/data/projects';import {skills} from '@/data/skills';
export const dynamic = 'force-static';
const siteUrl='https://lohithcoders.github.io/Lohith-Portfolio/';
const routes=['','about','skills','projects','experience','achievements','leadership','research','contact'];
export default function sitemap():MetadataRoute.Sitemap{return [...routes.map(route=>({url:new URL(route,siteUrl).href})),...projects.map(project=>({url:new URL(`projects/${project.slug}`,siteUrl).href})),...skills.map(skill=>({url:new URL(`skills/${skill.slug}`,siteUrl).href}))]}
