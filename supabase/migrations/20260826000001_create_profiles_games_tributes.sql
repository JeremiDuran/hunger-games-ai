-- Migration: 20260826000001_create_profiles_games_tributes.sql
-- Description: Core foundational schema (profiles, games with arena lore, tributes) with strict RLS and performance indexes

-- 1. ENUMS
create type public.game_status as enum ('setup', 'in_progress', 'finished', 'archived');
create type public.tribute_status as enum ('alive', 'dead');
create type public.tribute_gender as enum ('male', 'female', 'non_binary', 'unspecified');

-- 2. PROFILES TABLE
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  tokens_balance integer not null default 50 check (tokens_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create profile trigger on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Gamemaker-' || substring(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Revoke public execution of security definer function
revoke execute on function public.handle_new_user() from public, anon, authenticated;


-- 3. GAMES TABLE
create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'The 74th Annual Hunger Games',
  status public.game_status not null default 'setup',
  
  -- Arena Environment & Storytelling Lore
  arena_biome text not null default 'tropical_jungle' 
    check (arena_biome in ('tropical_jungle', 'ruined_cityscape', 'frozen_tundra', 'scorched_desert', 'swamp_quagmire', 'clockwork_arena')),
  arena_name text not null default 'Verdant Tropics',
  arena_description text not null default 'A dense equatorial rainforest canopy with razor-sharp foliage, venomous flora, suffocating humidity, and torrential flash floods.',
  
  -- Runtime Settings Matrix
  settings jsonb not null default '{
    "enable_bloodbath": true,
    "enable_muttations": true,
    "enable_disasters": true,
    "enable_sponsor_drops": true,
    "pacing": "normal"
  }'::jsonb,
  
  tribute_count integer not null default 24 check (tribute_count >= 2 and tribute_count <= 48),
  current_day integer not null default 0,
  current_phase_type text not null default 'bloodbath',
  winner_id uuid, -- FK to tributes added below
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Games Indexes & RLS
create index games_user_id_idx on public.games(user_id);
create index games_status_idx on public.games(status);

alter table public.games enable row level security;

create policy "Users can manage their own games" on public.games
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- 4. TRIBUTES TABLE
create table public.tributes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  district integer not null check (district >= 1 and district <= 24),
  gender public.tribute_gender not null default 'unspecified',
  personality varchar(280) default '',
  physical_aspect varchar(280) default '',
  avatar_url text,
  status public.tribute_status not null default 'alive',
  kill_count integer not null default 0 check (kill_count >= 0),
  stats jsonb not null default '{"health": 100, "strength": 50, "agility": 50, "intelligence": 50}'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  death_phase_id uuid,
  placement integer,
  created_at timestamptz not null default now()
);

-- Foreign Key constraint from games.winner_id -> tributes.id
alter table public.games
  add constraint games_winner_id_fkey
  foreign key (winner_id) references public.tributes(id) on delete set null;

create index games_winner_id_idx on public.games(winner_id);

-- Tributes Indexes & RLS
create index tributes_game_id_idx on public.tributes(game_id);
create index tributes_game_status_idx on public.tributes(game_id, status);
create index tributes_game_district_idx on public.tributes(game_id, district);

alter table public.tributes enable row level security;

create policy "Users can manage tributes for their games" on public.tributes
  for all to authenticated
  using (
    exists (
      select 1 from public.games
      where games.id = tributes.game_id
      and games.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.games
      where games.id = tributes.game_id
      and games.user_id = (select auth.uid())
    )
  );
