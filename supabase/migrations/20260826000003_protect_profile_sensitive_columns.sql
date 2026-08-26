-- Migration: 20260826000003_protect_profile_sensitive_columns.sql
-- Description: Enforce column-level security on public.profiles to protect role and tokens_balance from unauthorized client modification

-- 1. Revoke generic table-level UPDATE from anon and authenticated
revoke update on table public.profiles from anon, authenticated;

-- 2. Grant column-level UPDATE only on safe citizen-editable columns to authenticated users
grant update (username, avatar_url, updated_at) on table public.profiles to authenticated;

-- 3. Automatic updated_at timestamp trigger for public.profiles
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_set_profiles_updated_at on public.profiles;
create trigger trigger_set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();
