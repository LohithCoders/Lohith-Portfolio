import {bucketName,corsHeaders,createAdminClient,json,isAllowedOrigin,preflight} from '../_shared/resume.ts';

Deno.serve(async request=>{
  const options=preflight(request);
  if(options)return options;
  if(!isAllowedOrigin(request))return json(request,{error:'Origin not allowed.'},403);
  if(request.method!=='GET')return json(request,{error:'Method not allowed.'},405);

  try{
    const client=createAdminClient();
    const {data:active,error:queryError}=await client.from('resume_versions').select('object_path,filename,size_bytes,created_at').eq('is_active',true).maybeSingle();
    if(queryError)throw queryError;
    if(!active)return json(request,{error:'No resume is currently published.'},404);

    const url=new URL(request.url);
    if(url.searchParams.get('metadata')==='1')return json(request,{filename:active.filename,sizeBytes:Number(active.size_bytes),updatedAt:active.created_at});

    const download=url.searchParams.get('download')==='1';
    const {data:signed,error:signedError}=await client.storage.from(bucketName).createSignedUrl(active.object_path,60,{download:download?active.filename:false});
    if(signedError)throw signedError;
    return new Response(null,{status:302,headers:{...corsHeaders(request),'Location':signed.signedUrl}});
  }catch(error){
    console.error('Public resume resolver failed:',error instanceof Error?error.message:'unknown error');
    return json(request,{error:'Resume details are currently unavailable.'},503);
  }
});
