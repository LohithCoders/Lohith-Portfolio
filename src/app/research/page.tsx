import type {Metadata} from 'next';
import Link from 'next/link';
import {PageHeading,RelatedLinks} from '@/components/content/shared';
import {articles} from '@/data/research';
import {projects} from '@/data/projects';
import {ArrowUpRight} from 'lucide-react';

export const metadata:Metadata={
  title:'Technical Writing',
  description:'Technical articles by Lohith on agentic AI security, education technology and production AI systems.'
};

export default function ResearchPage(){
  const focus=projects.find(project=>project.id==='testpilot-ai');
  return <main id="content" className="page">
    <div className="content-section">
      <PageHeading
        eyebrow="WRITING / CURRENT ACADEMIC PROJECT"
        title="Ideas tested in practice."
        description="Technical articles and the academic major project currently taking my focus."
      />
      <section className="article-library">
        <h2>Technical writing</h2>
        <div className="article-list">
          {articles.map((article,index)=>(
            <article id={article.slug} className="article-card" key={article.id}>
              <small>
                <span>0{index+1} / {article.status.toUpperCase()}</span>
                {article.date!=='TODO'&&<time>{article.date}</time>}
              </small>
              <h3>
                {article.readMoreUrl!=='TODO'?(
                  <a href={article.readMoreUrl} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                ):(
                  article.title
                )}
              </h3>
              <p>{article.abstract}</p>
              {article.readMoreUrl!=='TODO'?(
                <a
                  className="article-read-link"
                  href={article.readMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read article <ArrowUpRight aria-hidden="true" size={15}/>
                </a>
              ):(
                <span className="article-read-link" aria-disabled="true">
                  Article link not supplied
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      {focus&&<section className="academic-focus" aria-labelledby="academic-focus-title">
        <div className="academic-focus-status">
          <p className="eyebrow">ACADEMIC PROJECT / PROTOTYPE</p>
          <span>{focus.status}</span>
        </div>
        <h2 id="academic-focus-title">{focus.name}</h2>
        <p>{focus.description}</p>
        <Link className="text-link" href={'/projects/'+focus.slug}>
          Explore TestPilot AI <ArrowUpRight aria-hidden="true" size={15}/>
        </Link>
        <RelatedLinks id={focus.id} title="Connected skills"/>
      </section>}
    </div>
  </main>;
}
