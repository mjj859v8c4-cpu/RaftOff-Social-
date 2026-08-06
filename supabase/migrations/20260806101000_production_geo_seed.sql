-- Production reference data: Michigan lakes + verified Lake St. Clair hotspots
-- These are geographic place records (not demo activity / fake users).

insert into public.lakes (id, slug, name, timezone, status)
values
  ('11111111-1111-1111-1111-111111111101', 'lake-st-clair', 'Lake St. Clair', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111102', 'grand-traverse-bay', 'Grand Traverse Bay', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111103', 'torch-lake', 'Torch Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111104', 'higgins-lake', 'Higgins Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111105', 'houghton-lake', 'Houghton Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111106', 'lake-charlevoix', 'Lake Charlevoix', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111107', 'walloon-lake', 'Walloon Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111108', 'burt-lake', 'Burt Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111109', 'mullett-lake', 'Mullett Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111110', 'crystal-lake', 'Crystal Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'gull-lake', 'Gull Lake', 'America/Detroit', 'active'),
  ('11111111-1111-1111-1111-111111111112', 'cass-lake', 'Cass Lake', 'America/Detroit', 'active')
on conflict (slug) do update set name = excluded.name, status = 'active';

-- Stable lake id for St. Clair used by hotspot inserts
do $$
declare
  st_clair uuid;
begin
  select id into st_clair from public.lakes where slug = 'lake-st-clair';

  insert into public.locations (
    lake_id, slug, name, type, point, verification_status, verified_at, status, attributes
  )
  values
    (st_clair, 'strawberry-island', 'Strawberry Island', 'social_sandbar',
      ST_SetSRID(ST_MakePoint(-82.7094, 42.5981), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"sandbar","supportsCheckIn":true}'::jsonb),
    (st_clair, 'gull-island', 'Gull Island', 'social_sandbar',
      ST_SetSRID(ST_MakePoint(-82.6821, 42.5303), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"sandbar","supportsCheckIn":true}'::jsonb),
    (st_clair, 'jobbie-nooner-area', 'Jobbie Nooner Area', 'social_sandbar',
      ST_SetSRID(ST_MakePoint(-82.6766, 42.538), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"sandbar","supportsCheckIn":true}'::jsonb),
    (st_clair, 'grassy-island', 'Grassy Island', 'social_sandbar',
      ST_SetSRID(ST_MakePoint(-82.6583, 42.6044), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"sandbar","supportsCheckIn":true}'::jsonb),
    (st_clair, 'anchor-bay', 'Anchor Bay', 'social_bay',
      ST_SetSRID(ST_MakePoint(-82.7166, 42.65), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"anchorage","supportsCheckIn":true}'::jsonb),
    (st_clair, 'big-muscamoot-bay', 'Big Muscamoot Bay', 'social_bay',
      ST_SetSRID(ST_MakePoint(-82.6607, 42.5578), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"anchorage","supportsCheckIn":true}'::jsonb),
    (st_clair, 'little-muscamoot-bay', 'Little Muscamoot Bay', 'social_bay',
      ST_SetSRID(ST_MakePoint(-82.626, 42.5781), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"anchorage","supportsCheckIn":true}'::jsonb),
    (st_clair, 'goose-bay', 'Goose Bay', 'social_bay',
      ST_SetSRID(ST_MakePoint(-82.6791, 42.5845), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"anchorage","supportsCheckIn":true}'::jsonb),
    (st_clair, 'fisher-bay', 'Fisher Bay', 'social_bay',
      ST_SetSRID(ST_MakePoint(-82.651, 42.6067), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"anchorage","supportsCheckIn":true}'::jsonb),
    (st_clair, 'metro-beach', 'Metro Beach', 'park',
      ST_SetSRID(ST_MakePoint(-82.8098, 42.5819), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"beach","supportsCheckIn":true}'::jsonb),
    (st_clair, 'harsens-island', 'Harsens Island', 'park',
      ST_SetSRID(ST_MakePoint(-82.5885, 42.5895), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"beach","supportsCheckIn":true}'::jsonb),
    (st_clair, 'grosse-pointe-shoreline', 'Grosse Pointe Shoreline', 'park',
      ST_SetSRID(ST_MakePoint(-82.8885, 42.3967), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"beach","supportsCheckIn":true}'::jsonb),
    (st_clair, 'st-clair-shores-marina', 'St. Clair Shores Marina', 'marina',
      ST_SetSRID(ST_MakePoint(-82.887, 42.493), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"marina","supportsCheckIn":true}'::jsonb),
    (st_clair, 'jefferson-beach-marina', 'Jefferson Beach Marina', 'marina',
      ST_SetSRID(ST_MakePoint(-82.8885, 42.4723), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"marina","supportsCheckIn":true}'::jsonb),
    (st_clair, 'emerald-city-harbor', 'Emerald City Harbor', 'marina',
      ST_SetSRID(ST_MakePoint(-82.8839, 42.4683), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"marina","supportsCheckIn":true}'::jsonb),
    (st_clair, 'macray-harbor', 'MacRay Harbor', 'marina',
      ST_SetSRID(ST_MakePoint(-82.832, 42.568), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"marina","supportsCheckIn":true}'::jsonb),
    (st_clair, 'belle-maer-harbor', 'Belle Maer Harbor', 'marina',
      ST_SetSRID(ST_MakePoint(-82.7865, 42.6145), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"marina","supportsCheckIn":true}'::jsonb),
    (st_clair, 'harley-ensign-memorial', 'Harley Ensign Memorial', 'boat_launch',
      ST_SetSRID(ST_MakePoint(-82.7747, 42.5933), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"launch","supportsCheckIn":true}'::jsonb),
    (st_clair, 'selfridge-area', 'Selfridge Area', 'boat_launch',
      ST_SetSRID(ST_MakePoint(-82.8347, 42.605), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"launch","supportsCheckIn":true}'::jsonb),
    (st_clair, 'fair-haven', 'Fair Haven', 'boat_launch',
      ST_SetSRID(ST_MakePoint(-82.65, 42.6792), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"launch","supportsCheckIn":true}'::jsonb),
    (st_clair, 'st-clair-flats', 'St. Clair Flats', 'region',
      ST_SetSRID(ST_MakePoint(-82.6327, 42.5959), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"flats","supportsCheckIn":true}'::jsonb),
    (st_clair, 'north-channel', 'North Channel', 'channel',
      ST_SetSRID(ST_MakePoint(-82.6075, 42.6102), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"channel","supportsCheckIn":true}'::jsonb),
    (st_clair, 'middle-channel', 'Middle Channel', 'channel',
      ST_SetSRID(ST_MakePoint(-82.5675, 42.5795), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"channel","supportsCheckIn":true}'::jsonb),
    (st_clair, 'south-channel', 'South Channel', 'channel',
      ST_SetSRID(ST_MakePoint(-82.6707, 42.5334), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"channel","supportsCheckIn":true}'::jsonb),
    (st_clair, 'st-clair-river-entrance', 'St. Clair River Entrance', 'channel_mouth',
      ST_SetSRID(ST_MakePoint(-82.6, 42.618), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"channel","supportsCheckIn":true}'::jsonb),
    (st_clair, 'detroit-river-entrance', 'Detroit River Entrance', 'channel_mouth',
      ST_SetSRID(ST_MakePoint(-82.918, 42.372), 4326)::geography, 'verified', now(), 'active',
      '{"hotspotType":"channel","supportsCheckIn":true}'::jsonb)
  on conflict (lake_id, slug) do update set
    name = excluded.name,
    type = excluded.type,
    point = excluded.point,
    verification_status = 'verified',
    verified_at = now(),
    status = 'active',
    attributes = excluded.attributes;
end $$;
