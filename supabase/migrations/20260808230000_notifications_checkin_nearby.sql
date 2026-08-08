-- Notifications — connection-adjacent "check-in nearby" alerts.
-- When someone checks in at the same spot (or within a short radius) as one
-- of their connections' most recent active check-in, let that connection
-- know. Respects show_on_water, hidden precision, and private audience —
-- never exposes exact GPS (mirrors public.check_ins_public rules).

create or replace function public.notify_connections_on_checkin_nearby()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
  v_actor_visible boolean;
  v_radius_m constant numeric := 3218; -- ~2 miles, matches "on the water" feel
  v_peer record;
begin
  if new.status <> 'active' or new.ended_at is not null then
    return new;
  end if;
  if new.precision = 'hidden' or new.audience = 'private' then
    return new;
  end if;

  select display_name, coalesce(show_on_water, true)
    into v_actor_name, v_actor_visible
  from public.profiles
  where id = new.user_id;

  if v_actor_visible is distinct from true then
    return new;
  end if;

  for v_peer in
    select distinct conn.pid as peer_id
    from (
      select case when profile_a = new.user_id then profile_b else profile_a end as pid
      from public.connections
      where profile_a = new.user_id or profile_b = new.user_id
    ) conn
    join public.profiles p on p.id = conn.pid and coalesce(p.show_on_water, true) = true
    join public.check_ins ci on ci.user_id = conn.pid
      and ci.status = 'active'
      and ci.expires_at > now()
      and ci.ended_at is null
      and ci.precision <> 'hidden'
      and ci.audience <> 'private'
    where not public.is_blocked_pair(new.user_id, conn.pid)
      and (
        (new.location_id is not null and ci.location_id = new.location_id)
        or (
          new.public_position is not null
          and ci.public_position is not null
          and ST_DWithin(ci.public_position, new.public_position, v_radius_m)
        )
      )
  loop
    insert into public.notifications (user_id, actor_id, type, title, body, target_type, target_id)
    values (
      v_peer.peer_id,
      new.user_id,
      'checkin_nearby',
      'Connection nearby',
      coalesce(v_actor_name, 'A connection') || ' just dropped anchor near you.',
      'check_in',
      new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_checkin_nearby on public.check_ins;
create trigger trg_notify_checkin_nearby
after insert on public.check_ins
for each row execute function public.notify_connections_on_checkin_nearby();
