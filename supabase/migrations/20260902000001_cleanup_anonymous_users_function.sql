-- Migration: 20260902000001_cleanup_anonymous_users_function.sql
-- Description: Stored procedure to safely purge stale anonymous (guest) users and their cascaded data, restricted to admin role

create or replace function public.cleanup_stale_anonymous_users(
  p_older_than interval default interval '24 hours'
)
returns table(deleted_count integer, deleted_user_ids uuid[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_deleted_count integer;
  v_deleted_ids uuid[];
begin
  -- 1. Security Check: Caller must be authenticated and have role = 'admin' in profiles
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid())
    and role = 'admin'
  ) into v_is_admin;

  if not coalesce(v_is_admin, false) then
    raise exception 'Unauthorized: Only Head Gamemakers (admin role) can execute user cleanup operations.';
  end if;

  -- 2. Delete anonymous users older than specified threshold
  with deleted as (
    delete from auth.users
    where (is_anonymous = true or email is null)
      and created_at < (now() - p_older_than)
    returning id
  )
  select count(*), array_agg(id)
  into v_deleted_count, v_deleted_ids
  from deleted;

  return query select coalesce(v_deleted_count, 0), coalesce(v_deleted_ids, array[]::uuid[]);
end;
$$;

-- Revoke execute from public and anon, grant to authenticated only
revoke execute on function public.cleanup_stale_anonymous_users(interval) from public, anon;
grant execute on function public.cleanup_stale_anonymous_users(interval) to authenticated;
