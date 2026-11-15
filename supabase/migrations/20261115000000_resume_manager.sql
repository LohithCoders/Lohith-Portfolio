insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-resumes','portfolio-resumes',false,10485760,array['application/pdf'])
on conflict (id) do update
set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique,
  filename text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default false
);

create unique index if not exists resume_versions_one_active
  on public.resume_versions (is_active) where is_active=true;

create index if not exists resume_versions_created_at
  on public.resume_versions (created_at desc);

alter table public.resume_versions enable row level security;
revoke all on table public.resume_versions from anon,authenticated;
grant all on table public.resume_versions to service_role;

create or replace function public.activate_resume_version(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists (select 1 from public.resume_versions where id=p_version_id) then
    raise exception 'Resume version does not exist';
  end if;

  update public.resume_versions set is_active=false where is_active=true;
  update public.resume_versions set is_active=true where id=p_version_id;
end;
$$;

revoke all on function public.activate_resume_version(uuid) from public,anon,authenticated;
grant execute on function public.activate_resume_version(uuid) to service_role;
