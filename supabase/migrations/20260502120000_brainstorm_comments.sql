create table if not exists public.brainstorm_comments (
  id bigint generated always as identity primary key,
  column_key text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists brainstorm_comments_column_created_idx
  on public.brainstorm_comments (column_key, created_at desc);

alter table public.brainstorm_comments enable row level security;

-- Allow API access via PostgREST when using the anon/authenticated role (e.g. anon key).
-- The service_role JWT still bypasses RLS and does not need these policies.
drop policy if exists "brainstorm_comments_select" on public.brainstorm_comments;
drop policy if exists "brainstorm_comments_insert" on public.brainstorm_comments;

create policy "brainstorm_comments_select"
on public.brainstorm_comments
for select
to anon, authenticated
using (true);

create policy "brainstorm_comments_insert"
on public.brainstorm_comments
for insert
to anon, authenticated
with check (true);

-- Refresh PostgREST schema cache (avoids PGRST205 right after creating the table)
notify pgrst, 'reload schema';
