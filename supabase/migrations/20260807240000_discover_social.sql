-- RaftOff Social — Phase 2 social discovery
-- Adds: discovery opt-out, notification RLS fix (actor can notify target),
-- follow/unfollow RPCs, mutual-connection count, and discovery/search RPCs
-- (people on your lake, similar interests, identity tag, new to lake,
-- suggested connections §29, full-text people search).

-- ---------------------------------------------------------------------------
-- Profiles: discovery opt-out
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists show_in_discovery boolean not null default true;

create index if not exists profiles_identity_tags_gin
  on public.profiles using gin (identity_tags);

create index if not exists profiles_home_lake_created_idx
  on public.profiles(home_lake_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications: allow the acting user (not just the recipient) to insert a
-- row, so client-side actions (connection request, follow) can fan out
-- notifications without a SECURITY DEFINER RPC for every action.
-- ---------------------------------------------------------------------------
drop policy if exists "Insert notifications authenticated" on public.notifications;
create policy "Insert notifications authenticated" on public.notifications
  for insert with check (
    auth.uid() = user_id
    or auth.uid() = actor_id
    or public.is_admin()
  );

drop policy if exists "Delete own notifications" on public.notifications;
create policy "Delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Block-aware pair helper — hide blocked users both directions
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Followers (§7): follow / unfollow with notification fan-out, block aware
-- ---------------------------------------------------------------------------
create or replace function public.follow_profile(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if target is null or target = me then raise exception 'invalid target'; end if;
  if public.is_blocked_pair(me, target) then raise exception 'unavailable'; end if;

  insert into public.follows (follower_id, following_id)
  values (me, target)
  on conflict do nothing;

  if found then
    insert into public.notifications (user_id, actor_id, type, title, body, target_type, target_id)
    values (target, me, 'new_follower', 'New follower', 'Someone started following you.', 'profile', me);
  end if;
end;
$$;

grant execute on function public.follow_profile(uuid) to authenticated;

create or replace function public.unfollow_profile(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.follows where follower_id = auth.uid() and following_id = target;
end;
$$;

grant execute on function public.unfollow_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Mutual connection count between me and another profile (Connections UX)
-- ---------------------------------------------------------------------------
create or replace function public.mutual_connection_count(other uuid)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  with mine as (
    select case when profile_a = auth.uid() then profile_b else profile_a end as pid
    from public.connections
    where profile_a = auth.uid() or profile_b = auth.uid()
  ),
  theirs as (
    select case when profile_a = other then profile_b else profile_a end as pid
    from public.connections
    where profile_a = other or profile_b = other
  )
  select count(*)::int from mine join theirs using (pid);
$$;

grant execute on function public.mutual_connection_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Discover: people on my home lake (also powers "new to the lake" via flag)
-- ---------------------------------------------------------------------------
create or replace function public.people_on_my_lake(p_limit integer default 20, p_new_only boolean default false)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  home_city text,
  is_verified boolean,
  badges text[],
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (select home_lake_id from public.profiles where id = auth.uid())
  select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.home_city,
         p.is_verified, p.badges, p.created_at
  from public.profiles p, me
  where p.home_lake_id is not null
    and p.home_lake_id = me.home_lake_id
    and p.id <> auth.uid()
    and p.is_blocked = false
    and p.show_in_discovery = true
    and not public.is_blocked_pair(auth.uid(), p.id)
    and (not p_new_only or p.created_at > now() - interval '45 days')
  order by p.created_at desc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.people_on_my_lake(integer, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Discover: shared-interest ranking
-- ---------------------------------------------------------------------------
create or replace function public.people_shared_interests(p_limit integer default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  home_city text,
  is_verified boolean,
  badges text[],
  shared_interests integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with my_interests as (
    select interest_id from public.profile_interests where profile_id = auth.uid()
  )
  select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.home_city,
         p.is_verified, p.badges, count(pi.interest_id)::int as shared_interests
  from public.profiles p
  join public.profile_interests pi
    on pi.profile_id = p.id and pi.interest_id in (select interest_id from my_interests)
  where p.id <> auth.uid()
    and p.is_blocked = false
    and p.show_in_discovery = true
    and not public.is_blocked_pair(auth.uid(), p.id)
  group by p.id
  having count(pi.interest_id) > 0
  order by shared_interests desc, p.display_name asc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.people_shared_interests(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Discover: identity-tag rows (fishermen / boaters / jet ski riders / ...)
-- ---------------------------------------------------------------------------
create or replace function public.people_by_identity_tag(p_tag text, p_limit integer default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  home_city text,
  is_verified boolean,
  badges text[]
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.home_city,
         p.is_verified, p.badges
  from public.profiles p
  where p_tag = any (p.identity_tags)
    and p.id <> auth.uid()
    and p.is_blocked = false
    and p.show_in_discovery = true
    and not public.is_blocked_pair(auth.uid(), p.id)
  order by p.display_name asc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.people_by_identity_tag(text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Suggested connections scoring (§29) — simple weighted version
-- ---------------------------------------------------------------------------
create or replace function public.suggested_connections(p_limit integer default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  home_city text,
  home_lake_id uuid,
  is_verified boolean,
  badges text[],
  shared_interests integer,
  mutual_count integer,
  same_lake boolean,
  score integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select id, home_lake_id from public.profiles where id = auth.uid()
  ),
  my_interests as (
    select interest_id from public.profile_interests where profile_id = auth.uid()
  ),
  my_connections as (
    select case when profile_a = auth.uid() then profile_b else profile_a end as pid
    from public.connections
    where profile_a = auth.uid() or profile_b = auth.uid()
  ),
  candidates as (
    select
      p.id, p.username, p.display_name, p.avatar_url, p.bio, p.home_city,
      p.home_lake_id, p.is_verified, p.badges,
      (
        select count(*)::int from public.profile_interests pi
        where pi.profile_id = p.id and pi.interest_id in (select interest_id from my_interests)
      ) as shared_interests,
      (
        select count(*)::int
        from public.connections c
        where (c.profile_a = p.id and c.profile_b in (select pid from my_connections))
           or (c.profile_b = p.id and c.profile_a in (select pid from my_connections))
      ) as mutual_count,
      (p.home_lake_id is not null and p.home_lake_id = (select home_lake_id from me)) as same_lake
    from public.profiles p
    where p.id <> auth.uid()
      and p.is_blocked = false
      and p.show_in_discovery = true
      and p.id not in (select pid from my_connections)
      and not exists (
        select 1 from public.connection_requests r
        where r.status = 'pending'
          and ((r.requester_id = auth.uid() and r.recipient_id = p.id)
            or (r.requester_id = p.id and r.recipient_id = auth.uid()))
      )
      and not public.is_blocked_pair(auth.uid(), p.id)
  )
  select
    id, username, display_name, avatar_url, bio, home_city, home_lake_id,
    is_verified, badges, shared_interests, mutual_count, same_lake,
    (case when same_lake then 30 else 0 end
      + shared_interests * 8
      + mutual_count * 12
      + case when avatar_url is not null then 4 else 0 end)::int as score
  from candidates
  order by score desc, display_name asc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.suggested_connections(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- People search: name, username, lake, boat, marina, interest (§ people search)
-- ---------------------------------------------------------------------------
create or replace function public.search_people(p_query text, p_limit integer default 25)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  home_city text,
  home_marina text,
  home_lake_id uuid,
  is_verified boolean,
  badges text[]
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select nullif(btrim(p_query), '') as term
  )
  select distinct
    p.id, p.username, p.display_name, p.avatar_url, p.bio,
    p.home_city, p.home_marina, p.home_lake_id, p.is_verified, p.badges
  from public.profiles p
  cross join q
  left join public.lakes l on l.id = p.home_lake_id
  left join public.boats b on b.owner_id = p.id
  left join public.profile_interests pi on pi.profile_id = p.id
  left join public.interests i on i.id = pi.interest_id
  where q.term is not null
    and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and p.is_blocked = false
    and not public.is_blocked_pair(auth.uid(), p.id)
    and (
      p.username ilike '%' || q.term || '%'
      or p.display_name ilike '%' || q.term || '%'
      or p.home_city ilike '%' || q.term || '%'
      or p.home_marina ilike '%' || q.term || '%'
      or l.name ilike '%' || q.term || '%'
      or b.nickname ilike '%' || q.term || '%'
      or b.name ilike '%' || q.term || '%'
      or b.model ilike '%' || q.term || '%'
      or b.manufacturer ilike '%' || q.term || '%'
      or i.label ilike '%' || q.term || '%'
    )
  order by p.display_name asc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.search_people(text, integer) to authenticated, anon;
