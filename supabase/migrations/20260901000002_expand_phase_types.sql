-- Migration: 20260901000002_expand_phase_types.sql
-- Description: Expand game_phases.phase_type check constraint to support extensible special phases (cataclysm, npc_overload, arena_event)

alter table public.game_phases
  drop constraint if exists game_phases_phase_type_check;

alter table public.game_phases
  add constraint game_phases_phase_type_check
  check (phase_type in ('bloodbath', 'day', 'night', 'feast', 'cataclysm', 'npc_overload', 'arena_event'));
