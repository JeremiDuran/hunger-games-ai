-- Migration: 20260826000002_add_user_roles_and_auth_foundation.sql
-- Description: Add user_role enum and role column to public.profiles table, and refine handle_new_user trigger

-- 1. ENUM for User Roles
create type public.user_role as enum ('user', 'admin');

-- 2. Add role column to profiles
alter table public.profiles 
  add column role public.user_role not null default 'user';

-- 3. Update auto-create profile trigger to assign default 'user' role safely
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Gamemaker-' || substring(new.id::text, 1, 8)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Revoke public execution of security definer function
revoke execute on function public.handle_new_user() from public, anon, authenticated;
