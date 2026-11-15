'use client';

import {useEffect,useState} from 'react';
import {Download,ExternalLink,FileText} from 'lucide-react';
import {PageHeading} from '@/components/content/shared';
import {formatFileSize,resumeIntegrationConfigured,resumePublicEndpoint,type ActiveResume} from '@/lib/resume';

type LoadState='loading'|'ready'|'unavailable'|'unpublished';

export function ResumeLaunchpad(){
  const [resume,setResume]=useState<ActiveResume|null>(null);
  const [state,setState]=useState<LoadState>(resumeIntegrationConfigured?'loading':'unavailable');

  useEffect(()=>{
    if(!resumeIntegrationConfigured)return;
    const controller=new AbortController();
    fetch(`${resumePublicEndpoint}?metadata=1`,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(response.status===404){setState('unpublished');return;}
        if(!response.ok)throw new Error('Resume details are unavailable.');
        const details=await response.json() as ActiveResume;
        setResume(details);
        setState('ready');
      })
      .catch(error=>{if(error instanceof Error&&error.name==='AbortError')return;setState('unavailable');});
    return()=>controller.abort();
  },[]);

  return <section className="content-section career-launchpad" id="career-launchpad">
    <PageHeading eyebrow="04 / CAREER LAUNCHPAD" title="Resume and professional profile." description="View or download the latest published resume."/>
    {state==='ready'&&resume?<>
      <div className="resume-public-meta"><FileText aria-hidden="true"/><span>{resume.filename}</span><span>{formatFileSize(resume.sizeBytes)}</span><span>Updated {new Intl.DateTimeFormat('en-IN',{dateStyle:'medium'}).format(new Date(resume.updatedAt))}</span></div>
      <div className="resume-public-actions">
        <a className="resume-action is-primary" href={resumePublicEndpoint} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true"/>View Resume</a>
        <a className="resume-action" href={`${resumePublicEndpoint}?download=1`}><Download aria-hidden="true"/>Download Resume</a>
      </div>
    </>:<p className="resume-public-state" role="status">{state==='loading'?'Loading resume details…':state==='unpublished'?'No resume is currently published.':'Resume details are currently unavailable.'}</p>}
  </section>;
}
