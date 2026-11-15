'use client';

import {type ChangeEvent,type DragEvent,type FormEvent,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {ArrowUpRight,Check,FileText,LogOut,RotateCcw,Upload,X} from 'lucide-react';
import {formatFileSize,getResumeClient,resumeAdminEndpoint,resumeIntegrationConfigured,resumePublishableKey,type ResumeVersion} from '@/lib/resume';

const maxResumeBytes=10*1024*1024;

export function ResumeManager(){
  const client=getResumeClient();
  const inputRef=useRef<HTMLInputElement>(null);
  const uploadRef=useRef<XMLHttpRequest|null>(null);
  const [session,setSession]=useState<Session|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [versions,setVersions]=useState<ResumeVersion[]>([]);
  const [file,setFile]=useState<File|null>(null);
  const [previewUrl,setPreviewUrl]=useState('');
  const selectedPreviewUrl=useMemo(()=>file?URL.createObjectURL(file):'', [file]);
  const [previewTitle,setPreviewTitle]=useState('');
  const [progress,setProgress]=useState(0);
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [dragOver,setDragOver]=useState(false);

  const loadVersions=useCallback(async()=>{
    if(!client)return;
    setBusy(true);
    const {data,error:invokeError}=await client.functions.invoke<{versions:ResumeVersion[]}>('resume-admin',{body:{action:'list'}});
    setBusy(false);
    if(invokeError){setError(invokeError.message.includes('403')?'This account is not authorized to manage resumes.':invokeError.message);return;}
    setVersions(data?.versions??[]);
    setError('');
  },[client]);

  useEffect(()=>{
    if(!client)return;
    let mounted=true;
    void client.auth.getSession().then(({data,error:sessionError})=>{
      if(!mounted)return;
      if(sessionError){setError('Could not restore the admin session. Please sign in again.');return;}
      setSession(data.session);
      if(data.session)void loadVersions();
    });
    return()=>{mounted=false;uploadRef.current?.abort();};
  },[client,loadVersions]);

  useEffect(()=>()=>{if(selectedPreviewUrl)URL.revokeObjectURL(selectedPreviewUrl);},[selectedPreviewUrl]);

  function chooseFile(candidate:File|undefined){
    setError('');setNotice('');
    if(!candidate)return;
    if(!candidate.name.toLowerCase().endsWith('.pdf')||(candidate.type&&candidate.type!=='application/pdf')){setFile(null);setError('Choose a PDF file.');return;}
    if(candidate.size>maxResumeBytes){setFile(null);setError('The PDF must be 10 MB or smaller.');return;}
    if(candidate.size===0){setFile(null);setError('The selected PDF is empty.');return;}
    setFile(candidate);
  }

  function onFileChange(event:ChangeEvent<HTMLInputElement>){chooseFile(event.currentTarget.files?.[0]);event.currentTarget.value='';}
  function onDrop(event:DragEvent<HTMLDivElement>){event.preventDefault();setDragOver(false);chooseFile(event.dataTransfer.files?.[0]);}

  async function signIn(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!client)return;
    setBusy(true);setError('');setNotice('');
    const {data,error:authError}=await client.auth.signInWithPassword({email:email.trim(),password});
    setBusy(false);
    if(authError){setError('Sign-in failed. Check the email and password.');return;}
    setSession(data.session);setPassword('');
    await loadVersions();
  }

  async function signOut(){
    if(!client)return;
    uploadRef.current?.abort();
    await client.auth.signOut();
    setSession(null);setVersions([]);setFile(null);setPreviewUrl('');setNotice('Signed out.');setError('');
  }

  function uploadResume(){
    if(!client||!session||!file||uploading)return;
    if(!window.confirm(`Publish “${file.name}” as the active resume? The previous resume will remain in version history.`))return;
    const request=new XMLHttpRequest();
    const form=new FormData();
    form.set('file',file,file.name);
    uploadRef.current=request;setUploading(true);setProgress(0);setError('');setNotice('Uploading and validating PDF…');
    request.open('POST',resumeAdminEndpoint);
    request.setRequestHeader('apikey',resumePublishableKey);
    request.setRequestHeader('Authorization',`Bearer ${session.access_token}`);
    request.setRequestHeader('x-resume-action','upload');
    request.upload.onprogress=event=>{if(event.lengthComputable)setProgress(Math.min(98,Math.round(event.loaded/event.total*98)));};
    request.onload=()=>{
      uploadRef.current=null;setUploading(false);setProgress(100);
      let result:{error?:string;unchanged?:boolean}|null=null;
      try{result=JSON.parse(request.responseText) as {error?:string;unchanged?:boolean};}catch{result=null;}
      if(request.status<200||request.status>=300){setNotice('');setError(result?.error??'Upload failed. The active resume was not changed.');return;}
      setFile(null);setNotice(result?.unchanged?'This file is already the active resume. No duplicate version was created.':'Resume published successfully.');
      void loadVersions();
    };
    request.onerror=()=>{uploadRef.current=null;setUploading(false);setNotice('');setError('Network error. Check the connection and active resume before retrying.');};
    request.onabort=()=>{uploadRef.current=null;setUploading(false);setNotice('');setError('Upload cancelled. Check the active resume before retrying.');};
    request.send(form);
  }

  function cancelUpload(){uploadRef.current?.abort();}

  async function previewVersion(version:ResumeVersion){
    if(!client)return;
    setBusy(true);setError('');
    const {data,error:invokeError}=await client.functions.invoke<{signedUrl:string}>('resume-admin',{body:{action:'preview',versionId:version.id}});
    setBusy(false);
    if(invokeError||!data?.signedUrl){setError('Could not open this resume version.');return;}
    setPreviewTitle(version.filename);setPreviewUrl(data.signedUrl);
  }

  async function restoreVersion(version:ResumeVersion){
    if(!client||version.isActive)return;
    if(!window.confirm(`Restore “${version.filename}” as the active resume? The current resume will remain in history.`))return;
    setBusy(true);setError('');setNotice('');
    const {error:invokeError}=await client.functions.invoke('resume-admin',{body:{action:'restore',versionId:version.id}});
    setBusy(false);
    if(invokeError){setError('Restore failed. The active resume was not changed.');return;}
    setNotice('Previous resume restored successfully.');
    await loadVersions();
  }

  const activeVersion=versions.find(version=>version.isActive);
  const previousVersions=versions.filter(version=>!version.isActive);

  return <main id="content" className="page resume-admin-page"><section className="content-section resume-manager">
    <header className="page-heading"><p className="eyebrow">SIGNAL TO INTELLIGENCE / ADMIN</p><h1>Resume Manager</h1><p>Publish and manage the resume shown on your portfolio.</p></header>
    {!resumeIntegrationConfigured?<div className="resume-manager-message" role="status"><strong>Resume storage is not connected yet.</strong><span>Complete the Supabase setup steps in the project’s resume manager guide before signing in.</span></div>:!session?<form className="resume-login" onSubmit={signIn}><h2>Administrator sign in</h2><label>Email<input type="email" autoComplete="username" required value={email} onChange={event=>setEmail(event.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)}/></label><button className="resume-publish-button" type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button><p>Only the configured administrator account can manage resumes.</p></form>:<>
      <div className="resume-manager-toolbar"><p>Signed in as <strong>{session.user.email}</strong></p><button type="button" className="resume-secondary-button" onClick={signOut}><LogOut aria-hidden="true"/>Sign out</button></div>
      <div className="resume-manager-grid">
        <section className="resume-upload-card" aria-labelledby="resume-upload-heading">
          <div className="resume-card-heading"><span>01 / UPLOAD</span><h2 id="resume-upload-heading">Drop your resume here</h2><p>Drag and drop your PDF or browse files. Maximum size: 10 MB.</p></div>
          <div className={`resume-dropzone${dragOver?' is-dragging':''}`} onDragOver={event=>{event.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}>
            <Upload aria-hidden="true"/><strong>{file?file.name:'Drop PDF to select'}</strong><span>{file?formatFileSize(file.size):'PDF files only · up to 10 MB'}</span>
            <button type="button" className="resume-secondary-button" onClick={()=>inputRef.current?.click()}>{file?'Replace selected PDF':'Browse files'}</button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onFileChange}/>
          </div>
          {file&&selectedPreviewUrl&&<div className="resume-selected-preview"><div><FileText aria-hidden="true"/><span>{file.name}<small>{formatFileSize(file.size)} · preview before publishing</small></span></div><button type="button" className="resume-text-button" onClick={()=>setFile(null)}>Remove selection</button><iframe src={selectedPreviewUrl} title={`Preview of ${file.name}`}/></div>}
          {uploading&&<div className="resume-progress" role="status"><div><span>Uploading resume</span><span>{progress}%</span></div><progress max="100" value={progress}/><button type="button" className="resume-text-button" onClick={cancelUpload}>Cancel upload</button></div>}
          <button type="button" className="resume-publish-button" onClick={uploadResume} disabled={!file||uploading||busy}>{uploading?'PUBLISHING…':'PUBLISH RESUME'}</button>
        </section>
        <section className="resume-history-card" aria-labelledby="resume-history-heading">
          <div className="resume-card-heading"><span>02 / VERSION HISTORY</span><h2 id="resume-history-heading">Published resumes</h2><p>Restore a previous version at any time.</p></div>
          {activeVersion?<article className="resume-version is-active"><div className="resume-version-top"><span className="resume-active-badge"><Check aria-hidden="true"/>ACTIVE</span><time dateTime={activeVersion.createdAt}>{new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(activeVersion.createdAt))}</time></div><h3>{activeVersion.filename}</h3><p>{formatFileSize(activeVersion.sizeBytes)}</p><button type="button" className="resume-secondary-button" onClick={()=>void previewVersion(activeVersion)} disabled={busy}><FileText aria-hidden="true"/>Preview active</button></article>:<p className="resume-empty-state">No resume has been published yet.</p>}
          {previousVersions.length>0&&<div className="resume-version-list"><h3>Previous versions</h3>{previousVersions.map(version=><article className="resume-version" key={version.id}><div className="resume-version-top"><time dateTime={version.createdAt}>{new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(version.createdAt))}</time><span>{formatFileSize(version.sizeBytes)}</span></div><h4>{version.filename}</h4><div className="resume-version-actions"><button type="button" className="resume-secondary-button" onClick={()=>void previewVersion(version)} disabled={busy}><FileText aria-hidden="true"/>Preview</button><button type="button" className="resume-secondary-button" onClick={()=>void restoreVersion(version)} disabled={busy}><RotateCcw aria-hidden="true"/>Restore</button></div></article>)}</div>}
          <button type="button" className="resume-text-button" onClick={()=>void loadVersions()} disabled={busy}>{busy?'Refreshing…':'Refresh version list'} <ArrowUpRight aria-hidden="true"/></button>
        </section>
      </div>
      {previewUrl&&previewTitle&&<div className="resume-preview-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget){setPreviewUrl('');setPreviewTitle('');}}}><section className="resume-preview-dialog" role="dialog" aria-modal="true" aria-label={`Preview ${previewTitle}`}><header><div><span>PDF PREVIEW</span><h2>{previewTitle}</h2></div><button type="button" className="resume-icon-button" aria-label="Close preview" onClick={()=>{setPreviewUrl('');setPreviewTitle('');}}><X aria-hidden="true"/></button></header><iframe src={previewUrl} title={`Preview of ${previewTitle}`}/></section></div>}
    </>}
    {error&&<p className="resume-notice is-error" role="alert">{error}</p>}{notice&&<p className="resume-notice" role="status">{notice}</p>}
  </section></main>;
}
