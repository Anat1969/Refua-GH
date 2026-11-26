-- Outputs created inside the app (Anat, 25.11.2026). Applied to cultura-GH (ktqmwpbzcnzkhjskqisy) as migrations
-- refua_outputs and mag_articles_add_refua. Kept here as the record; the live definitions are the source.
-- 1. refua_outputs: one row per output (kind, topic, title, lead, blocks with level and refs, question, certainty, derived_from, form).
--    RLS: public read of rows that are not deleted. No write policy.
-- 2. refua_add_output(p jsonb): security definer, the only way to write. Checks the kind, the topic id, 2 to 14 blocks,
--    the level of every block, no fact without a source, the safety-gate words, and a rate limit of 30 in 10 minutes.
-- 3. mag_articles: a branch 'refua:' || id, so every saved output appears in the magazine "חוט" by itself.
create table if not exists public.refua_outputs (
  id text primary key, kind text not null check (kind in ('story','paper','essay','creation')), topic text not null,
  title text not null check (char_length(title) between 2 and 160), lead text not null default '', blocks jsonb not null,
  question text not null default '', certainty text check (certainty in ('established','likely','open')),
  derived_from text, form text, created_at timestamptz not null default now(), deleted boolean not null default false
);
