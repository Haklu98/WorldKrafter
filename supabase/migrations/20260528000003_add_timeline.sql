-- Time formats table
-- Stores calendar/time system definitions for a world.
-- A world can have multiple formats but a timeline references one.

create table if not exists public.time_formats (
  id               uuid primary key default uuid_generate_v4(),
  world_id         uuid not null references public.worlds (id) on delete cascade,
  owner_id         uuid not null references auth.users (id) on delete cascade,
  name             text not null,
  is_gregorian     boolean not null default false,
  hours_per_day    integer not null default 24,
  days_per_week    integer not null default 7,
  weeks_per_year   integer not null default 52,
  months_per_year  integer not null default 12,
  lunar_cycle_days numeric(6,2),          -- optional, e.g. 29.53
  day_names        jsonb,                 -- ["Monday","Tuesday",...] length = days_per_week
  month_names      jsonb,                 -- ["January","February",...] length = months_per_year
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger time_formats_set_updated_at
  before update on public.time_formats
  for each row execute procedure public.set_updated_at();

alter table public.time_formats enable row level security;

create policy "Users can view their own time formats"
  on public.time_formats for select using (auth.uid() = owner_id);
create policy "Users can insert their own time formats"
  on public.time_formats for insert with check (auth.uid() = owner_id);
create policy "Users can update their own time formats"
  on public.time_formats for update using (auth.uid() = owner_id);
create policy "Users can delete their own time formats"
  on public.time_formats for delete using (auth.uid() = owner_id);

-- Timelines table
-- A timeline belongs to a world and uses a time format.

create table if not exists public.timelines (
  id             uuid primary key default uuid_generate_v4(),
  world_id       uuid not null references public.worlds (id) on delete cascade,
  owner_id       uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  time_format_id uuid references public.time_formats (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger timelines_set_updated_at
  before update on public.timelines
  for each row execute procedure public.set_updated_at();

alter table public.timelines enable row level security;

create policy "Users can view their own timelines"
  on public.timelines for select using (auth.uid() = owner_id);
create policy "Users can insert their own timelines"
  on public.timelines for insert with check (auth.uid() = owner_id);
create policy "Users can update their own timelines"
  on public.timelines for update using (auth.uid() = owner_id);
create policy "Users can delete their own timelines"
  on public.timelines for delete using (auth.uid() = owner_id);
