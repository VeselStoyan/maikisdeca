-- Allow any column_key values validated by the app (e.g. mechanism / offer / stair).
-- Safe if the constraint name matches your DB; if not, drop the check on column_key manually.

alter table public.brainstorm_comments drop constraint if exists brainstorm_comments_column_key_check;

notify pgrst, 'reload schema';
