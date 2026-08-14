-- Single-workspace cloud sync table.
-- One row (id = 1) holds the entire app state (projects, tasks, documents,
-- categories, activity, team, daily reports) as JSONB.

create table if not exists public.eng_workspace (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint eng_workspace_singleton check (id = 1)
);

alter table public.eng_workspace enable row level security;

create policy "anon select workspace" on public.eng_workspace
  for select to anon using (true);

create policy "anon insert workspace" on public.eng_workspace
  for insert to anon with check (true);

create policy "anon update workspace" on public.eng_workspace
  for update to anon using (true) with check (true);

create policy "anon delete workspace" on public.eng_workspace
  for delete to anon using (true);
