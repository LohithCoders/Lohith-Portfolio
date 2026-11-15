import {createClient} from 'npm:@supabase/supabase-js@2.119.0';

export const bucketName='portfolio-resumes';
const allowedOrigins=[Deno.env.get('SITE_ORIGIN')??'','http://localhost:3000','http://127.0.0.1:3000'].filter(Boolean);

export function isAllowedOrigin(request:Request){
  const origin=request.headers.get('origin');
  return !origin||allowedOrigins.includes(origin);
}

export function corsHeaders(request:Request){
  const origin=request.headers.get('origin')??'';
  const allowed=isAllowedOrigin(request)&&origin;
  return {
    ...(allowed?{'Access-Control-Allow-Origin':origin}:{}),
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-resume-action',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Max-Age':'86400',
    'Cache-Control':'no-store',
    'Vary':'Origin',
  };
}

export function preflight(request:Request){
  if(request.method!=='OPTIONS')return null;
  if(!isAllowedOrigin(request))return new Response('Origin not allowed',{status:403});
  return new Response(null,{status:204,headers:corsHeaders(request)});
}

export function json(request:Request,body:unknown,status=200){
  return Response.json(body,{status,headers:corsHeaders(request)});
}

export function createAdminClient(){
  const url=Deno.env.get('SUPABASE_URL');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)throw new Error('Resume service secrets are not configured.');
  return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

export type ResumeSupabaseClient=ReturnType<typeof createAdminClient>;

export async function authorizeAdmin(request:Request){
  const authorization=request.headers.get('authorization')??'';
  const token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  if(!token)return {error:json(request,{error:'Authentication is required.'},401)};

  const allowedEmail=(Deno.env.get('RESUME_ADMIN_EMAIL')??'').trim().toLowerCase();
  if(!allowedEmail)return {error:json(request,{error:'Resume administrator is not configured.'},503)};

  const client=createAdminClient();
  const {data,error}=await client.auth.getUser(token);
  const user=data.user;
  if(error||!user)return {error:json(request,{error:'Your session is invalid or expired.'},401)};
  if(user.email?.trim().toLowerCase()!==allowedEmail)return {error:json(request,{error:'This account is not authorized to manage resumes.'},403)};
  return {client,user};
}

export function safeError(error:unknown){
  return error instanceof Error?error.message:'Unexpected resume service error.';
}
