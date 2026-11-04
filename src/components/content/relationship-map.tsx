'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {getBacklinks,getEntityHref,getRelated} from '@/data/relationships';
import {projects} from '@/data/projects';
import {skills} from '@/data/skills';

export function RelationshipMap(){
  const [open,setOpen]=useState(false);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const [skillId,setSkillId]=useState('react');
  const [projectId,setProjectId]=useState('');
  const selectedSkill=skills.find(skill=>skill.id===skillId)??skills[0];
  const connectedProjects=getBacklinks(selectedSkill.id).map(edge=>projects.find(project=>project.id===edge.from)).filter(project=>project!==undefined);
  const selectedProject=projects.find(project=>project.id===projectId&&connectedProjects.some(item=>item.id===projectId))??connectedProjects[0];
  const connectedSkills=selectedProject?getRelated(selectedProject.id).filter(edge=>edge.type==='uses-skill').map(edge=>skills.find(skill=>skill.id===edge.to)).filter(skill=>skill!==undefined):[];

  useEffect(()=>{const dialog=dialogRef.current;if(open&&dialog&&!dialog.open)dialog.showModal();},[open]);

  const chooseSkill=(id:string)=>{setSkillId(id);const nextProject=getBacklinks(id).find(edge=>projects.some(project=>project.id===edge.from))?.from??'';setProjectId(nextProject);};

  return <>
    <button type="button" className="map-launch" onClick={()=>setOpen(true)} aria-haspopup="dialog">
      <span className="map-launch-mark" aria-hidden="true"><i/><i/><i/></span>
      <span><b>Explore the project map</b><small>Follow verified skill and project links</small></span>
      <span aria-hidden="true">↗</span>
    </button>
    <dialog ref={dialogRef} className="relationship-map-backdrop" onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)event.currentTarget.close();}}>
      <section className="relationship-map" aria-labelledby="relationship-map-title">
        <header className="relationship-map-header"><div><p className="eyebrow">CONNECTED WORK / VERIFIED RELATIONSHIPS</p><h2 id="relationship-map-title">Follow the links.</h2><p>Choose a skill to see projects linked to it, then open a project to trace its documented technologies.</p></div><button type="button" className="map-close" onClick={()=>dialogRef.current?.close()} aria-label="Close project map">×</button></header>
        <div className="relationship-map-columns">
          <section className="map-column map-skill-column" aria-labelledby="map-skills-heading"><h3 id="map-skills-heading">01 / SKILL</h3><div className="map-node-list">{skills.map(skill=><button type="button" key={skill.id} className={`map-node${skill.id===selectedSkill.id?' is-selected':''}`} aria-pressed={skill.id===selectedSkill.id} onClick={()=>chooseSkill(skill.id)}><span className="map-node-dot"/><span>{skill.name}</span><small>{skill.status}</small></button>)}</div></section>
          <section className="map-column map-project-column" aria-labelledby="map-projects-heading"><h3 id="map-projects-heading">02 / RELATED PROJECT</h3>{connectedProjects.length?<div className="map-node-list">{connectedProjects.map(project=><button type="button" key={project.id} className={`map-node map-project-node${project.id===selectedProject?.id?' is-selected':''}`} aria-pressed={project.id===selectedProject?.id} onClick={()=>setProjectId(project.id)}><span className="map-node-dot"/><span>{project.name}</span><small>{project.status}</small></button>)}</div>:<p className="map-empty">No project relationship is recorded for {selectedSkill.name} yet.</p>}{selectedProject&&<Link className="map-open-link" href={getEntityHref(selectedProject.id)??'/projects'} onClick={()=>dialogRef.current?.close()}>Open {selectedProject.name} ↗</Link>}</section>
          <section className="map-column map-related-column" aria-labelledby="map-related-heading"><h3 id="map-related-heading">03 / PROJECT SKILLS</h3>{selectedProject&&connectedSkills.length?<div className="map-node-list">{connectedSkills.map(skill=><Link key={skill.id} className={`map-node map-related-node${skill.id===selectedSkill.id?' is-selected':''}`} href={getEntityHref(skill.id)??'/skills'} onClick={()=>dialogRef.current?.close()}><span className="map-node-dot"/><span>{skill.name}</span><small>{skill.status}</small></Link>)}</div>:<p className="map-empty">Select a linked project to see its recorded skills.</p>}</section>
        </div>
        <footer className="relationship-map-footer"><span className="map-legend-dot"/> Connections come from the portfolio relationship data.</footer>
      </section>
    </dialog>
  </>;
}
