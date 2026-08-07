-- Distinct creator/founder badges for DJ & CJ (in addition to founding-member).
-- Safe if 20260807235000 already ran — only appends missing badge ids.

do $$
declare
  founder_badges text[] := array['founding-member', 'founder', 'creator'];
begin
  update public.profiles
  set
    display_name = case lower(username)
      when 'dj' then 'DJ'
      when 'cj' then 'CJ'
      else display_name
    end,
    is_verified = true,
    badges = (
      select array_agg(distinct b)
      from unnest(coalesce(badges, '{}'::text[]) || founder_badges) as b
    ),
    bio = coalesce(
      nullif(bio, ''),
      case lower(username)
        when 'dj' then
          'Tech with the bag. Met CJ, shipped RaftOff Social for lakes, parties, and St. Clair raft-ups. First on the water.'
        when 'cj' then
          'Thought of RaftOff in bed one day. Three years later linked with DJ and built RaftOff Social — lakes, parties, St. Clair.'
        else bio
      end
    ),
    updated_at = now()
  where lower(username) in ('dj', 'cj')
     or lower(display_name) in ('dj', 'cj');
end $$;
