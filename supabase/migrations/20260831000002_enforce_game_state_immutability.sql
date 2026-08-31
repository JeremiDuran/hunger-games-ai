-- Migration: 20260831000002_enforce_game_state_immutability.sql
-- Description: Enforce database-level state immutability on public.games and public.tributes based on match lifecycle status

-- 1. GAME UPDATE VALIDATION TRIGGER FUNCTION
create or replace function public.validate_game_state_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Disallow changing immutable primary and relational keys
  if new.id is distinct from old.id then
    raise exception 'Game ID cannot be changed';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Game owner (user_id) cannot be changed';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'Game created_at timestamp cannot be changed';
  end if;

  -- Prevent setup/configuration modifications when game is active or finished
  if old.status in ('in_progress', 'finished') then
    if new.title is distinct from old.title or
       new.arena_name is distinct from old.arena_name or
       new.arena_description is distinct from old.arena_description or
       new.settings is distinct from old.settings or
       new.tribute_count is distinct from old.tribute_count then
      raise exception 'Cannot modify game configuration (title, arena, settings, tribute_count) while game status is %', old.status;
    end if;
  end if;

  -- Prevent combat/runtime outcome mutations once match is finished
  if old.status = 'finished' then
    if new.winner_id is distinct from old.winner_id or
       new.current_day is distinct from old.current_day or
       new.current_phase_type is distinct from old.current_phase_type or
       new.ended_at is distinct from old.ended_at then
      raise exception 'Cannot modify match outcome fields on a finished game';
    end if;
  end if;

  -- Maintain updated_at timestamp
  new.updated_at = now();

  return new;
end;
$$;

-- Attach trigger to public.games
drop trigger if exists trigger_validate_game_state_update on public.games;
create trigger trigger_validate_game_state_update
  before update on public.games
  for each row
  execute function public.validate_game_state_update();


-- 2. TRIBUTE MUTATION VALIDATION TRIGGER FUNCTION
create or replace function public.validate_tribute_state_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_game_status public.game_status;
begin
  -- Handle INSERT: only allow adding tributes if game is in 'setup' or 'archived'
  if tg_op = 'INSERT' then
    select status into v_game_status
    from public.games
    where id = new.game_id;

    if v_game_status is null then
      raise exception 'Game % does not exist', new.game_id;
    end if;

    if v_game_status not in ('setup', 'archived') then
      raise exception 'Cannot add tributes to a game with status %', v_game_status;
    end if;

    return new;
  end if;

  -- Handle DELETE: only allow deleting tributes if game is in 'setup' or 'archived'
  if tg_op = 'DELETE' then
    select status into v_game_status
    from public.games
    where id = old.game_id;

    -- If parent game exists (not a cascade deletion where parent is already gone), enforce status
    if v_game_status is not null and v_game_status not in ('setup', 'archived') then
      raise exception 'Cannot delete tributes from a game with status %', v_game_status;
    end if;

    return old;
  end if;

  -- Handle UPDATE: enforce field-level immutability based on parent game status
  if tg_op = 'UPDATE' then
    -- Disallow changing immutable primary and relational keys
    if new.id is distinct from old.id then
      raise exception 'Tribute ID cannot be changed';
    end if;

    if new.game_id is distinct from old.game_id then
      raise exception 'Tribute game_id cannot be changed';
    end if;

    if new.created_at is distinct from old.created_at then
      raise exception 'Tribute created_at timestamp cannot be changed';
    end if;

    select status into v_game_status
    from public.games
    where id = old.game_id;

    if v_game_status is null then
      raise exception 'Game % does not exist', old.game_id;
    end if;

    if v_game_status = 'finished' then
      raise exception 'Cannot modify tribute records of a finished game';
    end if;

    if v_game_status = 'in_progress' then
      if new.name is distinct from old.name or
         new.district is distinct from old.district or
         new.gender is distinct from old.gender or
         new.personality is distinct from old.personality or
         new.physical_aspect is distinct from old.physical_aspect or
         new.avatar_url is distinct from old.avatar_url then
        raise exception 'Cannot modify tribute setup attributes (name, district, gender, personality, physical_aspect, avatar_url) while game is in progress';
      end if;
    end if;

    return new;
  end if;

  return null;
end;
$$;

-- Attach trigger to public.tributes
drop trigger if exists trigger_validate_tribute_state_mutation on public.tributes;
create trigger trigger_validate_tribute_state_mutation
  before insert or update or delete on public.tributes
  for each row
  execute function public.validate_tribute_state_mutation();
