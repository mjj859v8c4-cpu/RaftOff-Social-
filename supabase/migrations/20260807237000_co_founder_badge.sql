-- Ensure DJ & CJ have distinct creator + co-founder badges (re-run safe).
update public.profiles
set
  is_verified = true,
  badges = (
    select array_agg(distinct b)
    from unnest(
      coalesce(badges, '{}'::text[])
      || array['creator', 'co-founder', 'founding-member']::text[]
    ) as b
  ),
  updated_at = now()
where lower(username) in ('dj', 'cj')
   or lower(display_name) in ('dj', 'cj');
