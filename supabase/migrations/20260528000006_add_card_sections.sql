-- Add structured sections to cards
-- Each section has a heading (h2) and a body text paragraph.
-- Stored as a jsonb array: [{ "heading": "...", "body": "..." }]

alter table public.cards
  add column if not exists sections jsonb not null default '[]'::jsonb;
