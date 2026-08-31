-- Migration: 20260901000001_create_game_phases_events_alliances.sql
-- Description: Create game_phases, game_phase_events, and game_alliances tables with strict RLS and performance indexes

-- 1. GAME_PHASES TABLE
create table public.game_phases (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  day_number integer not null default 0 check (day_number >= 0),
  phase_type text not null check (phase_type in ('bloodbath', 'day', 'night', 'feast')),
  phase_order integer not null check (phase_order >= 0),
  fallen_tribute_ids uuid[] not null default '{}',
  status text not null default 'completed' check (status in ('pending', 'simulating', 'completed')),
  created_at timestamptz not null default now(),
  constraint game_phases_game_order_key unique (game_id, phase_order)
);

-- Indexes for game_phases
create index game_phases_game_id_idx on public.game_phases(game_id);
create index game_phases_fallen_tributes_gin_idx on public.game_phases using gin(fallen_tribute_ids);

-- RLS for game_phases
alter table public.game_phases enable row level security;

create policy "Users can manage game phases for their games" on public.game_phases
  for all to authenticated
  using (
    exists (
      select 1 from public.games
      where games.id = game_phases.game_id
      and games.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.games
      where games.id = game_phases.game_id
      and games.user_id = (select auth.uid())
    )
  );


-- 2. GAME_PHASE_EVENTS TABLE
create table public.game_phase_events (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.game_phases(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  event_order integer not null check (event_order >= 0),
  event_category text not null check (event_category in ('combat', 'forage', 'hazard', 'sponsor', 'mutt', 'social')),
  outcome_type text not null check (outcome_type in ('death', 'wound', 'loot', 'flee', 'alliance', 'idle')),
  tribute_ids uuid[] not null default '{}',
  killer_ids uuid[],
  victim_ids uuid[],
  narrative_text text not null default '',
  state_delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint game_phase_events_phase_order_key unique (phase_id, event_order)
);

-- Indexes for game_phase_events
create index game_phase_events_phase_id_idx on public.game_phase_events(phase_id);
create index game_phase_events_game_id_idx on public.game_phase_events(game_id);
create index game_phase_events_tribute_ids_gin_idx on public.game_phase_events using gin(tribute_ids);
create index game_phase_events_killer_ids_gin_idx on public.game_phase_events using gin(killer_ids);
create index game_phase_events_victim_ids_gin_idx on public.game_phase_events using gin(victim_ids);

-- RLS for game_phase_events
alter table public.game_phase_events enable row level security;

create policy "Users can manage phase events for their games" on public.game_phase_events
  for all to authenticated
  using (
    exists (
      select 1 from public.games
      where games.id = game_phase_events.game_id
      and games.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.games
      where games.id = game_phase_events.game_id
      and games.user_id = (select auth.uid())
    )
  );


-- 3. GAME_ALLIANCES TABLE
create table public.game_alliances (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  tribute_ids uuid[] not null check (cardinality(tribute_ids) >= 2),
  status text not null default 'active' check (status in ('active', 'dissolved', 'betrayed')),
  formed_phase_id uuid references public.game_phases(id) on delete set null,
  dissolved_phase_id uuid references public.game_phases(id) on delete set null,
  betrayed_by_tribute_id uuid references public.tributes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes for game_alliances
create index game_alliances_game_id_idx on public.game_alliances(game_id);
create index game_alliances_game_status_idx on public.game_alliances(game_id, status);
create index game_alliances_formed_phase_id_idx on public.game_alliances(formed_phase_id);
create index game_alliances_dissolved_phase_id_idx on public.game_alliances(dissolved_phase_id);
create index game_alliances_betrayed_by_idx on public.game_alliances(betrayed_by_tribute_id);
create index game_alliances_tributes_gin_idx on public.game_alliances using gin(tribute_ids);

-- RLS for game_alliances
alter table public.game_alliances enable row level security;

create policy "Users can manage alliances for their games" on public.game_alliances
  for all to authenticated
  using (
    exists (
      select 1 from public.games
      where games.id = game_alliances.game_id
      and games.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.games
      where games.id = game_alliances.game_id
      and games.user_id = (select auth.uid())
    )
  );


-- 4. FOREIGN KEY LINK: tributes.death_phase_id -> game_phases.id
alter table public.tributes
  add constraint tributes_death_phase_id_fkey
  foreign key (death_phase_id) references public.game_phases(id) on delete set null;

create index tributes_death_phase_id_idx on public.tributes(death_phase_id);
