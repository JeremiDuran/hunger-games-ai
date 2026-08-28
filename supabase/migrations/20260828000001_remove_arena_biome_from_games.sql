-- Migration: 20260828000001_remove_arena_biome_from_games.sql
-- Description: Completely remove arena_biome column and its check constraint from games table

alter table public.games drop column if exists arena_biome;
