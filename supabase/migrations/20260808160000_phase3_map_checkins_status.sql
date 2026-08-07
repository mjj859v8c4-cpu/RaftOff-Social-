-- RaftOff Social — Phase 3: map presence, check-in duration, temporary statuses
-- §10-12, §40: Location sheet check-ins must respect show_on_water; never expose exact GPS.

-- ---------------------------------------------------------------------------
-- check_ins_public: hide peers who opted out of "show on water", but always
-- let a user see their own active check-in (so their own UI still works).
-- ---------------------------------------------------------------------------
create or replace view public.check_ins_public as
select
  ci.id, ci.user_id, ci.boat_id, ci.lake_id, ci.location_id,
  ci.public_position, ci.vibe, ci.message, ci.audience, ci.precision,
  ci.starts_at, ci.expires_at, ci.ended_at, ci.status, ci.created_at
from public.check_ins ci
join public.profiles p on p.id = ci.user_id
where ci.status = 'active'
  and ci.expires_at > now()
  and ci.ended_at is null
  and ci.precision <> 'hidden'
  and (p.show_on_water = true or ci.user_id = auth.uid());

grant select on public.check_ins_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Manual checkout stays a simple UPDATE (see endCheckIn in lib/api/production.ts).
-- Add an explicit RPC too, so the map / location sheet can end a check-in
-- without needing update access beyond ownership.
-- ---------------------------------------------------------------------------
create or replace function public.end_check_in(p_check_in_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_ins
  set status = 'ended', ended_at = now()
  where id = p_check_in_id
    and user_id = auth.uid()
    and status = 'active';

  if not found then
    raise exception 'check-in not found or not yours';
  end if;
end;
$$;

revoke all on function public.end_check_in(uuid) from public;
grant execute on function public.end_check_in(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Temporary statuses (~24h) — one active status per profile.
-- Table already exists (20260807200000_social_profiles.sql); add safe
-- upsert / clear RPCs so the client never has to juggle delete+insert races.
-- ---------------------------------------------------------------------------
alter table public.user_statuses
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_my_status(
  p_body text,
  p_hours numeric default 24,
  p_location_id uuid default null
)
returns public.user_statuses
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  capped_hours numeric := least(greatest(coalesce(p_hours, 24), 0.25), 24);
  home_lake uuid;
  row_out public.user_statuses;
begin
  if me is null then
    raise exception 'sign in required';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'status cannot be empty';
  end if;
  if length(p_body) > 140 then
    raise exception 'status is too long';
  end if;

  select home_lake_id into home_lake from public.profiles where id = me;

  delete from public.user_statuses where profile_id = me;

  insert into public.user_statuses (profile_id, lake_id, location_id, body, expires_at)
  values (
    me,
    home_lake,
    p_location_id,
    trim(p_body),
    now() + make_interval(mins => round(capped_hours * 60)::int)
  )
  returning * into row_out;

  return row_out;
end;
$$;

revoke all on function public.set_my_status(text, numeric, uuid) from public;
grant execute on function public.set_my_status(text, numeric, uuid) to authenticated;

create or replace function public.clear_my_status()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_statuses where profile_id = auth.uid();
$$;

revoke all on function public.clear_my_status() from public;
grant execute on function public.clear_my_status() to authenticated;
