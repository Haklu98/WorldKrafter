-- Add worlds table
-- Applied manually via SQL Editor on initial deploy; this file keeps the repo in sync.

create table if not exists public.worlds (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security — owners can only see and manage their own worlds
alter table public.worlds enable row level security;

create policy "Users can view their own worlds"
  on public.worlds for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own worlds"
  on public.worlds for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own worlds"
  on public.worlds for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own worlds"
  on public.worlds for delete
  using (auth.uid() = owner_id);
