-- Run this if you created the table before insert policies existed and POST fails with:
-- new row violates row-level security policy for table "brainstorm_comments"

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

notify pgrst, 'reload schema';
