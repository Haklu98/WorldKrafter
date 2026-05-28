-- Initial schema
-- This file is tracked in version control and linked to Supabase via GitHub integration.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Automatically create a profile row when a new user signs up.
-- Reads username from raw_user_meta_data, which is set by the app on signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Worlds table
-- Each world belongs to exactly one user and is private to them.
create table if not exists public.worlds (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security on worlds — owners can only see and manage their own worlds
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
