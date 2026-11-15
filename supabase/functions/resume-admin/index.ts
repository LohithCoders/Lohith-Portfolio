import {authorizeAdmin,bucketName,json,isAllowedOrigin,preflight,type ResumeSupabaseClient} from '../_shared/resume.ts';

const maxBytes=10*1024*1024;

function safeFilename(name:string){
  const base=name.split(/[\\/]/).pop()??'Lohith_Resume.pdf';
  return base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g,'-').trim().slice(0,120)||'Lohith_Resume.pdf';
}

function toVersion(row:{id:string;filename:string;size_bytes:number;created_at:string;is_active:boolean}){
  return {id:row.id,filename:row.filename,sizeBytes:Number(row.size_bytes),createdAt:row.created_at,isActive:row.is_active};
}

async function uploadResume(request:Request,client:ResumeSupabaseClient,userId:string){
  const form=await request.formData();
  const file=form.get('file');
  if(!(file instanceof File))return json(request,{error:'Select a PDF file to upload.'},400);
  if(!file.name.toLowerCase().endsWith('.pdf'))return json(request,{error:'The filename must end in .pdf.'},400);
  if(file.type&&file.type!=='application/pdf'&&file.type!=='application/x-pdf'&&file.type!=='application/octet-stream')return json(request,{error:'The selected file is not a PDF.'},400);
  if(file.size===0||file.size>maxBytes)return json(request,{error:'The PDF must be between 1 byte and 10 MB.'},413);

  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')return json(request,{error:'The file contents do not have a valid PDF header.'},415);
  if(request.signal.aborted)return new Response(null,{status:499});

  const digestBytes=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const sha256=Array.from(digestBytes,value=>value.toString(16).padStart(2,'0')).join('');
  const {data:active,error:activeError}=await client.from('resume_versions').select('sha256').eq('is_active',true).maybeSingle();
  if(activeError)throw activeError;
  if(active?.sha256===sha256)return json(request,{ok:true,unchanged:true});

  const filename=safeFilename(file.name);
  const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
  const objectPath=`versions/${timestamp}_${crypto.randomUUID()}_Lohith_Resume.pdf`;
  const {error:storageError}=await client.storage.from(bucketName).upload(objectPath,bytes,{contentType:'application/pdf',upsert:false,cacheControl:'0'});
  if(storageError)throw storageError;
  if(request.signal.aborted){await client.storage.from(bucketName).remove([objectPath]);return new Response(null,{status:499});}

  const {data:version,error:insertError}=await client.from('resume_versions').insert({object_path:objectPath,filename,size_bytes:file.size,sha256,created_by:userId,is_active:false}).select('id').single();
  if(insertError){await client.storage.from(bucketName).remove([objectPath]);throw insertError;}

  if(request.signal.aborted){
    await client.from('resume_versions').delete().eq('id',version.id);
    await client.storage.from(bucketName).remove([objectPath]);
    return new Response(null,{status:499});
  }

  const {error:activateError}=await client.rpc('activate_resume_version',{p_version_id:version.id});
  if(activateError){
    await client.from('resume_versions').delete().eq('id',version.id);
    await client.storage.from(bucketName).remove([objectPath]);
    throw activateError;
  }
  return json(request,{ok:true,unchanged:false,versionId:version.id});
}

Deno.serve(async request=>{
  const options=preflight(request);
  if(options)return options;
  if(!isAllowedOrigin(request))return json(request,{error:'Origin not allowed.'},403);
  if(request.method!=='POST')return json(request,{error:'Method not allowed.'},405);

  try{
    const auth=await authorizeAdmin(request);
    if('error' in auth)return auth.error;
    const action=request.headers.get('x-resume-action');
    if(action==='upload')return await uploadResume(request,auth.client,auth.user.id);

    const payload=await request.json() as {action?:string;versionId?:string};
    if(payload.action==='list'){
      const {data,error}=await auth.client.from('resume_versions').select('id,filename,size_bytes,created_at,is_active').order('created_at',{ascending:false});
      if(error)throw error;
      return json(request,{versions:(data??[]).map(toVersion)});
    }
    if(payload.action==='preview'||payload.action==='restore'){
      if(!payload.versionId||!/^[0-9a-f-]{36}$/i.test(payload.versionId))return json(request,{error:'A valid resume version is required.'},400);
      const {data:version,error:versionError}=await auth.client.from('resume_versions').select('id,object_path').eq('id',payload.versionId).maybeSingle();
      if(versionError)throw versionError;
      if(!version)return json(request,{error:'This resume version was not found.'},404);

      if(payload.action==='preview'){
        const {data:signed,error:signedError}=await auth.client.storage.from(bucketName).createSignedUrl(version.object_path,600);
        if(signedError)throw signedError;
        return json(request,{signedUrl:signed.signedUrl});
      }

      const {data:storedFile,error:storageError}=await auth.client.storage.from(bucketName).download(version.object_path);
      if(storageError||!storedFile)return json(request,{error:'The stored PDF is unavailable; the active resume was not changed.'},409);
      const {error:restoreError}=await auth.client.rpc('activate_resume_version',{p_version_id:version.id});
      if(restoreError)throw restoreError;
      return json(request,{ok:true});
    }
    return json(request,{error:'Unknown resume management action.'},400);
  }catch(error){
    console.error('Resume admin operation failed:',error instanceof Error?error.message:'unknown error');
    return json(request,{error:'Resume operation failed. The currently active resume was preserved.'},500);
  }
});
