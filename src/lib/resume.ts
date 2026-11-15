import {createClient} from '@supabase/supabase-js';

const supabaseUrl=(process.env.NEXT_PUBLIC_SUPABASE_URL??'').trim().replace(/\/+$/,'');
const supabasePublishableKey=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??'').trim();

export const resumeIntegrationConfigured=Boolean(supabaseUrl&&supabasePublishableKey);
export const resumeAdminEndpoint=supabaseUrl?`${supabaseUrl}/functions/v1/resume-admin`:'';
export const resumePublicEndpoint=supabaseUrl?`${supabaseUrl}/functions/v1/resume-public`:'';
export const resumePublishableKey=supabasePublishableKey;

let browserClient:ReturnType<typeof createClient>|null=null;

export function getResumeClient(){
  if(!resumeIntegrationConfigured)return null;
  browserClient??=createClient(supabaseUrl,supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});
  return browserClient;
}

export type ResumeVersion={
  id:string;
  filename:string;
  sizeBytes:number;
  createdAt:string;
  isActive:boolean;
};

export type ActiveResume={filename:string;sizeBytes:number;updatedAt:string};

export function formatFileSize(bytes:number){
  if(bytes<1024)return `${bytes} B`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(0)} KB`;
  return `${(bytes/(1024*1024)).toFixed(2)} MB`;
}
