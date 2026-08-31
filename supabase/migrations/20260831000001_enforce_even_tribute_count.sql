-- Migration: 20260831000001_enforce_even_tribute_count.sql
-- Description: Enforce that tribute_count in public.games must be a multiple of two (even integer between 2 and 48)

alter table public.games
  drop constraint if exists games_tribute_count_check;

alter table public.games
  add constraint games_tribute_count_check
  check (tribute_count >= 2 and tribute_count <= 48 and tribute_count % 2 = 0);
