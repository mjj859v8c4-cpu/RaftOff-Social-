-- On the Bay social zone + additional St. Clair / Anchor Bay waterfront venues.

do $$
declare
  st_clair uuid;
begin
  select id into st_clair from public.lakes where slug = 'lake-st-clair';
  if st_clair is null then
    raise exception 'lake-st-clair not found';
  end if;

  insert into public.locations (
    lake_id, slug, name, type, description, point,
    verification_status, verified_at, status, attributes
  )
  values
    (st_clair, 'on-the-bay', 'On the Bay', 'social_bay',
      'Anchor Bay social zone — raft-ups, sandbar energy, and weekend scene',
      ST_SetSRID(ST_MakePoint(-82.708, 42.648), 4326)::geography, 'verified', now(), 'active',
      '{"group":"social","supportsCheckIn":true,"supportsLocationFeed":true,"defaultVibes":["party","chill","family"],"regionHint":"Anchor Bay"}'::jsonb),
    (st_clair, 'shortys-bar-grill', 'Shorty''s Bar & Grill', 'restaurant',
      'New Baltimore · Anchor Bay waterfront',
      ST_SetSRID(ST_MakePoint(-82.7385, 42.6842), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Anchor Bay après-boat stop — listed on RaftOff.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'fin-eatery', 'Fin''s Eatery', 'restaurant',
      'New Baltimore riverfront dining',
      ST_SetSRID(ST_MakePoint(-82.7358, 42.6828), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"Riverfront dinner after a bay day.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'waterfront-grosse-pointe', 'The Waterfront Restaurant', 'restaurant',
      'Grosse Pointe Park · lakefront dining',
      ST_SetSRID(ST_MakePoint(-82.9125, 42.3855), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"South-shore lakefront — featured dock-and-dine partner.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'mikes-on-the-water', 'Mike''s on the Water', 'restaurant',
      'St. Clair Shores · Nautical Mile corridor',
      ST_SetSRID(ST_MakePoint(-82.8838, 42.4795), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Mile traffic bar — I''m here check-ins for dockside crews.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'pier-41-marina-bar', 'Pier 41 Marina Bar', 'restaurant',
      'St. Clair Shores marina district',
      ST_SetSRID(ST_MakePoint(-82.8895, 42.4885), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Marina bar pin for south-shore boaters.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'brownes-restaurant', 'Browne''s Restaurant', 'restaurant',
      'Trenton · Detroit River mouth corridor',
      ST_SetSRID(ST_MakePoint(-83.1785, 42.1395), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"River-mouth dining for south-end crews.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'captains-club-algonac', 'Captain''s Club', 'restaurant',
      'Algonac · St. Clair River',
      ST_SetSRID(ST_MakePoint(-82.5625, 42.6185), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Riverfront club — featured north-channel partner.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'river-crab-blue-water', 'Blue Water Inn', 'restaurant',
      'Port Huron · Blue Water area gateway',
      ST_SetSRID(ST_MakePoint(-82.4255, 42.9745), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"North-end river bar for St. Clair day trips.","supportsCheckIn":true}'::jsonb)
  on conflict (lake_id, slug) do update set
    name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    point = excluded.point,
    verification_status = excluded.verification_status,
    verified_at = excluded.verified_at,
    status = excluded.status,
    attributes = excluded.attributes;
end $$;
