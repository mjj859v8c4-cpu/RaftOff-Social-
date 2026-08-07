-- Distinct creator/founder badges for DJ & CJ (in addition to founding-member).
-- Safe if 20260807235000 already ran — only appends missing badge ids.

do $$
declare
  founder_badges text[] := array['founding-member', 'creator', 'co-founder', 'founder'];
begin
  update public.profiles
  set
    display_name = case
      when lower(username) = 'dj' or lower(display_name) = 'dj' then 'DJ'
      when lower(username) = 'cj' or lower(display_name) = 'cj' then 'CJ'
      else display_name
    end,
    is_verified = true,
    badges = (
      select array_agg(distinct b)
      from unnest(coalesce(badges, '{}'::text[]) || founder_badges) as b
    ),
    bio = coalesce(
      nullif(bio, ''),
      case
        when lower(username) = 'dj' or lower(display_name) = 'dj' then
          'Co-creator of RaftOff Social. Tech expert who met CJ and shipped the app for lakes, parties, and rafting off on St. Clair.'
        when lower(username) = 'cj' or lower(display_name) = 'cj' then
          'Thought of RaftOff in bed one day. Three years later met DJ and built RaftOff Social — lakes, parties, rafting off on St. Clair.'
        else bio
      end
    ),
    updated_at = now()
  where lower(username) in ('dj', 'cj')
     or lower(display_name) in ('dj', 'cj');
end $$;
