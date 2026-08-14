-- Real auth schema: per-user profiles, per-user workspaces, owner-scoped storage.
-- Run this once in the Supabase SQL editor. It is idempotent.

-- ============================================================================
-- 1) PROFILES — one row per authenticated user, auto-created on signup.
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  title text not null default 'Project Admin',
  role text not null default 'admin' check (role in ('admin', 'engineer', 'viewer')),
  avatar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "delete own profile" on public.profiles;
create policy "delete own profile" on public.profiles
  for delete to authenticated using (id = auth.uid());

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, title, role, avatar)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    'Project Admin',
    'admin',
    upper(left(coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2) WORKSPACES — one JSONB row per user holding all app data.
-- ============================================================================
drop table if exists public.eng_workspace;

create table if not exists public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

drop policy if exists "own workspace select" on public.workspaces;
create policy "own workspace select" on public.workspaces
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "own workspace insert" on public.workspaces;
create policy "own workspace insert" on public.workspaces
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own workspace update" on public.workspaces;
create policy "own workspace update" on public.workspaces
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own workspace delete" on public.workspaces;
create policy "own workspace delete" on public.workspaces
  for delete to authenticated using (user_id = auth.uid());

create index if not exists workspaces_user_id_idx on public.workspaces (user_id);

-- ============================================================================
-- 3) STORAGE — PRIVATE bucket. Nothing is publicly readable; files are only
--    accessed by the authenticated owner through short-lived signed URLs.
-- ============================================================================
-- Remove all previous public/anon read-write policies.
drop policy if exists "anon insert documents" on storage.objects;
drop policy if exists "anon update documents" on storage.objects;
drop policy if exists "anon delete documents" on storage.objects;
drop policy if exists "anon select documents" on storage.objects;
drop policy if exists "public insert documents" on storage.objects;
drop policy if exists "public select documents" on storage.objects;

-- Make the bucket private so public URLs stop working.
update storage.buckets set public = false where id = 'documents';

-- Owner can read files under their own folder: {user_id}/...
create policy "auth select own documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and name like auth.uid()::text || '/%');

-- Authenticated owner can manage files under their own folder: {user_id}/...
drop policy if exists "auth insert own documents" on storage.objects;
create policy "auth insert own documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and name like auth.uid()::text || '/%');

drop policy if exists "auth update own documents" on storage.objects;
create policy "auth update own documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and name like auth.uid()::text || '/%')
  with check (bucket_id = 'documents' and name like auth.uid()::text || '/%');

drop policy if exists "auth delete own documents" on storage.objects;
create policy "auth delete own documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and name like auth.uid()::text || '/%');
