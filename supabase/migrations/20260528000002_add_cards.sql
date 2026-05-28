-- Cards table
-- A card is the core content unit of a world. Each card has a type and belongs to a world.

create type public.card_type as enum (
  'Character',
  'Noble House',
  'Tribe',
  'Landmark',
  'Religion',
  'Region',
  'Kingdom',
  'Guild',
  'Order',
  'Faction',
  'Cult',
  'Event',
  'Battle',
  'Festival',
  'Location',
  'Dungeon'
);

create table if not exists public.cards (
  id          uuid primary key default uuid_generate_v4(),
  world_id    uuid not null references public.worlds (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  type        public.card_type not null,
  title       text not null,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast recent-edits queries per world
create index cards_world_updated_idx on public.cards (world_id, updated_at desc);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute procedure public.set_updated_at();

-- Row Level Security — scoped to world owner
alter table public.cards enable row level security;

create policy "Users can view cards in their worlds"
  on public.cards for select
  using (auth.uid() = owner_id);

create policy "Users can insert cards in their worlds"
  on public.cards for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own cards"
  on public.cards for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own cards"
  on public.cards for delete
  using (auth.uid() = owner_id);
