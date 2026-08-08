-- Suggested connections (§29) — rebalance scoring toward spec weights:
-- same lake +40, same marina +20, mutual connection +15 each, shared
-- interest +10 each, shared boat manufacturer +5. Signature and returned
-- columns are unchanged so existing callers (features/social/discover.ts)
-- keep working as-is.

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
    select id, home_lake_id, home_marina from public.profiles where id = auth.uid()
  ),
  my_boat as (
    select manufacturer
    from public.boats
    where owner_id = auth.uid() and manufacturer is not null
    order by is_primary desc, created_at asc
    limit 1
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
      (p.home_lake_id is not null and p.home_lake_id = (select home_lake_id from me)) as same_lake,
      (
        p.home_marina is not null
        and (select home_marina from me) is not null
        and p.home_marina = (select home_marina from me)
      ) as same_marina,
      exists (
        select 1
        from public.boats b, my_boat mb
        where b.owner_id = p.id and b.manufacturer is not null and b.manufacturer = mb.manufacturer
      ) as shared_manufacturer
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
    (case when same_lake then 40 else 0 end
      + case when same_marina then 20 else 0 end
      + shared_interests * 10
      + mutual_count * 15
      + case when shared_manufacturer then 5 else 0 end)::int as score
  from candidates
  order by score desc, display_name asc
  limit greatest(1, least(p_limit, 60));
$$;

grant execute on function public.suggested_connections(integer) to authenticated;
