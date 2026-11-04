import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Breadcrumbs,RelatedLinks} from '@/components/content/shared';
import {projects,projectBySlug} from '@/data/projects';

export function generateStaticParams(){return projects.map(project=>({slug:project.slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const project=projectBySlug(slug);
  return project?{title:project.name,description:project.description,openGraph:{title:project.name,description:project.description}}:{title:'Project not found'};
}

export default async function ProjectDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const project=projectBySlug(slug);
  if(!project)notFound();
  const index=projects.findIndex(item=>item.id===project.id);
  const previous=projects[(index+projects.length-1)%projects.length];
  const next=projects[(index+1)%projects.length];

  return <main id="content" className="page"><article className="content-section project-detail">
    <Breadcrumbs items={[{label:'Projects',href:'/projects'},{label:project.name}]}/>
    <header className="page-heading project-page-heading">
      <p className="eyebrow">PROJECT / DETAIL</p>
      <div className="project-title-row">
        <h1>{project.name}</h1>
        <div className="project-title-links">
          {project.githubUrl==='TODO'?<span className="project-title-link is-placeholder">Repository · TODO</span>:<a className="project-title-link" href={project.githubUrl} target="_blank" rel="noopener noreferrer">Repository ↗</a>}
          {project.liveUrl==='TODO'?<span className="project-title-link is-placeholder">Live demo · TODO</span>:<a className="project-title-link is-primary" href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
        </div>
      </div>
      <p>{project.description}</p>
    </header>
    <p className="status-label">Status: {project.status}</p>
    <section className="prose-block"><h2>The problem</h2><p>{project.problem}</p><h2>Approach</h2><p>{project.solution}</p></section>
    <RelatedLinks id={project.id} title="Technologies and related work"/>
    <nav className="project-pagination" aria-label="Project navigation">
      <Link href={'/projects/'+previous.slug}>← Previous: {previous.name}</Link>
      <Link href={'/projects/'+next.slug}>Next: {next.name} →</Link>
    </nav>
  </article></main>;
}
