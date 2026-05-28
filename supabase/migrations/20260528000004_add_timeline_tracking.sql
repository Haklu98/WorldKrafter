-- Add tracking type and pivot card support to timelines

create type public.timeline_tracking_type as enum ('before_after', 'era', 'age');

alter table public.timelines
  add column if not exists tracking_type public.timeline_tracking_type not null default 'before_after',
  add column if not exists pivot_card_id uuid references public.cards (id) on delete set null,
  add column if not exists before_label  text not null default 'Before',
  add column if not exists after_label   text not null default 'After';

-- Timeline periods — used for era and age tracking types.
-- For 'era': name is auto-generated ("Era 1", "Era 2", ...) based on position.
-- For 'age': name is user-defined per period.

create table if not exists public.timeline_periods (
  id          uuid primary key default uuid_generate_v4(),
  timeline_id uuid not null references public.timelines (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  position    integer not null,           -- 1-based ordering
  name        text,                       -- null = auto "Era {position}"
  years       integer not null default 0,
  months      integer not null default 0,
  days        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (timeline_id, position)
);

create trigger timeline_periods_set_updated_at
  before update on public.timeline_periods
  for each row execute procedure public.set_updated_at();

alter table public.timeline_periods enable row level security;

create policy "Users can view their own timeline periods"
  on public.timeline_periods for select using (auth.uid() = owner_id);
create policy "Users can insert their own timeline periods"
  on public.timeline_periods for insert with check (auth.uid() = owner_id);
create policy "Users can update their own timeline periods"
  on public.timeline_periods for update using (auth.uid() = owner_id);
create policy "Users can delete their own timeline periods"
  on public.timeline_periods for delete using (auth.uid() = owner_id);
