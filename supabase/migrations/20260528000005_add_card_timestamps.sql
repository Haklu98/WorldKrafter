-- Card timestamps
-- A card can have multiple named timestamps (e.g. "Born", "Deceased").
-- Each timestamp is linked to a timeline and stores a year/month/day value.
-- The label is free-form but driven by card type conventions in the app.

create table if not exists public.card_timestamps (
  id          uuid primary key default uuid_generate_v4(),
  card_id     uuid not null references public.cards (id) on delete cascade,
  timeline_id uuid not null references public.timelines (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  label       text not null,   -- e.g. "Born", "Deceased", "Formed", "Event"
  year        integer not null,
  month       integer,
  day         integer,
  sort_key    bigint generated always as (
                year::bigint * 10000 +
                coalesce(month, 0)::bigint * 100 +
                coalesce(day, 0)::bigint
              ) stored,        -- pre-computed for fast ordering
  created_at  timestamptz not null default now()
);

create index card_timestamps_timeline_sort_idx
  on public.card_timestamps (timeline_id, sort_key);

create index card_timestamps_card_idx
  on public.card_timestamps (card_id);

alter table public.card_timestamps enable row level security;

create policy "Users can view their own card timestamps"
  on public.card_timestamps for select using (auth.uid() = owner_id);
create policy "Users can insert their own card timestamps"
  on public.card_timestamps for insert with check (auth.uid() = owner_id);
create policy "Users can update their own card timestamps"
  on public.card_timestamps for update using (auth.uid() = owner_id);
create policy "Users can delete their own card timestamps"
  on public.card_timestamps for delete using (auth.uid() = owner_id);
