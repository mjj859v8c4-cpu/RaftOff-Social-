-- Mark DJ and CJ as RaftOff founders when their profiles exist.
-- profiles.id references auth.users, so this does NOT create auth accounts.
-- After DJ/CJ sign up (or claim usernames dj / cj), re-run the UPDATE block
-- or apply this migration — see docs/FOUNDERS.md.

-- Prefer clean usernames when early auto-generated handles match dj_* / cj_*
-- Only rewrite when the short username is still available.
do $$
declare
  dj_id uuid;
  cj_id uuid;
begin
  select id into dj_id
  from public.profiles
  where lower(username) = 'dj'
     or lower(username) like 'dj\_%' escape '\'
     or lower(display_name) = 'dj'
  order by case when lower(username) = 'dj' then 0 else 1 end, created_at
  limit 1;

  select id into cj_id
  from public.profiles
  where lower(username) = 'cj'
     or lower(username) like 'cj\_%' escape '\'
     or lower(display_name) = 'cj'
  order by case when lower(username) = 'cj' then 0 else 1 end, created_at
  limit 1;

  if dj_id is not null and not exists (
    select 1 from public.profiles where lower(username) = 'dj' and id <> dj_id
  ) then
    update public.profiles
    set
      username = 'dj',
      display_name = 'DJ',
      is_verified = true,
      badges = (
        select array_agg(distinct b)
        from unnest(
          coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
        ) as b
      ),
      bio = coalesce(
        nullif(bio, ''),
        'Tech with the bag. Met CJ, shipped RaftOff Social for lakes, parties, and St. Clair raft-ups. First on the water.'
      ),
      updated_at = now()
    where id = dj_id;
  elsif dj_id is not null then
    update public.profiles
    set
      display_name = 'DJ',
      is_verified = true,
      badges = (
        select array_agg(distinct b)
        from unnest(
          coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
        ) as b
      ),
      bio = coalesce(
        nullif(bio, ''),
        'Tech with the bag. Met CJ, shipped RaftOff Social for lakes, parties, and St. Clair raft-ups. First on the water.'
      ),
      updated_at = now()
    where id = dj_id;
  end if;

  if cj_id is not null and not exists (
    select 1 from public.profiles where lower(username) = 'cj' and id <> cj_id
  ) then
    update public.profiles
    set
      username = 'cj',
      display_name = 'CJ',
      is_verified = true,
      badges = (
        select array_agg(distinct b)
        from unnest(
          coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
        ) as b
      ),
      bio = coalesce(
        nullif(bio, ''),
        'Thought of RaftOff in bed one day. Three years later linked with DJ and built RaftOff Social — lakes, parties, St. Clair.'
      ),
      updated_at = now()
    where id = cj_id;
  elsif cj_id is not null then
    update public.profiles
    set
      display_name = 'CJ',
      is_verified = true,
      badges = (
        select array_agg(distinct b)
        from unnest(
          coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
        ) as b
      ),
      bio = coalesce(
        nullif(bio, ''),
        'Thought of RaftOff in bed one day. Three years later linked with DJ and built RaftOff Social — lakes, parties, St. Clair.'
      ),
      updated_at = now()
    where id = cj_id;
  end if;
end $$;

-- Idempotent badge/display polish for exact @dj / @cj rows
update public.profiles
set
  display_name = 'DJ',
  is_verified = true,
  badges = (
    select array_agg(distinct b)
    from unnest(
      coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
    ) as b
  ),
  updated_at = now()
where lower(username) = 'dj';

update public.profiles
set
  display_name = 'CJ',
  is_verified = true,
  badges = (
    select array_agg(distinct b)
    from unnest(
      coalesce(badges, '{}'::text[]) || array['founding-member', 'founder']::text[]
    ) as b
  ),
  updated_at = now()
where lower(username) = 'cj';
