-- Lake St. Clair bars & restaurants for partner / advertising pitch.
-- Differentiated by diningCategory + partnerTier (featured vs listed).

do $$
declare
  st_clair uuid;
begin
  select id into st_clair from public.lakes where slug = 'lake-st-clair';
  if st_clair is null then
    raise exception 'lake-st-clair not found — run production geo seed first';
  end if;

  insert into public.locations (
    lake_id, slug, name, type, description, point,
    verification_status, verified_at, status, attributes
  )
  values
    (st_clair, 'scotty-simpsons', 'Scotty Simpson’s Fish & Chips', 'restaurant',
      'Nautical Mile classic · St. Clair Shores',
      ST_SetSRID(ST_MakePoint(-82.8794, 42.4732), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Dock-and-dine landmark on the Mile — featured partner placement.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'bliss-nautical-mile', 'Bliss', 'restaurant',
      'Nautical Mile nightlife · Jefferson',
      ST_SetSRID(ST_MakePoint(-82.8812, 42.4761), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"nightlife","partner":true,"partnerTier":"featured","pitch":"Prime nightlife pin — reach boaters before they pick a dock.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'brownies-on-the-lake', 'Brownie’s on the Lake', 'restaurant',
      'St. Clair Shores waterfront',
      ST_SetSRID(ST_MakePoint(-82.8825, 42.4788), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Waterfront patio energy — featured in Bars & food.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'lucianos-on-the-mile', 'Luciano’s Italian Restaurant', 'restaurant',
      'Nautical Mile dining',
      ST_SetSRID(ST_MakePoint(-82.8801, 42.4745), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"Listed on RaftOff — upgrade to Featured for map & strip priority.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'mad-crab-scs', 'Mad Crab', 'restaurant',
      'St. Clair Shores seafood',
      ST_SetSRID(ST_MakePoint(-82.884, 42.4812), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"Seafood stop for crews coming off the lake.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'pat-obriens-scs', 'Pat O’Brien’s Bar & Grill', 'restaurant',
      'St. Clair Shores bar',
      ST_SetSRID(ST_MakePoint(-82.8778, 42.4705), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Après-anchor bar pin for Mile traffic.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'lakeside-bar-grill', 'Lakeside Bar & Grill', 'restaurant',
      'Near Jefferson Beach corridor',
      ST_SetSRID(ST_MakePoint(-82.8865, 42.492), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Marina-adjacent listing for dockside crews.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'deck-at-macray', 'The Deck at MacRay Harbor', 'restaurant',
      'MacRay Harbor · Harrison Twp',
      ST_SetSRID(ST_MakePoint(-82.8315, 42.5685), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Harbor patio — featured dock-and-dine placement.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'cj-barrymores', 'C.J. Barrymore’s', 'restaurant',
      'Harrison Township · near lake corridor',
      ST_SetSRID(ST_MakePoint(-82.8355, 42.5895), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"nightlife","partner":true,"partnerTier":"listed","pitch":"Large-venue nightlife pin for lake-day spillover.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'the-wharf-st-clair', 'The Wharf Restaurant', 'restaurant',
      'St. Clair riverfront',
      ST_SetSRID(ST_MakePoint(-82.4865, 42.8265), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Riverfront dining — north-lake featured partner.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'gilberts-lodge', 'Gilbert’s Lodge', 'restaurant',
      'St. Clair',
      ST_SetSRID(ST_MakePoint(-82.489, 42.824), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"Town dining listing for St. Clair day-trippers.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'tin-fish-new-baltimore', 'Tin Fish', 'restaurant',
      'New Baltimore · Anchor Bay',
      ST_SetSRID(ST_MakePoint(-82.7368, 42.6815), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"waterfront_dining","partner":true,"partnerTier":"featured","pitch":"Anchor Bay waterfront — featured for north-bay boaters.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'pinkeys-boulevard-inn', 'Pinkey’s Boulevard Inn', 'restaurant',
      'St. Clair',
      ST_SetSRID(ST_MakePoint(-82.4925, 42.821), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"restaurant","partner":true,"partnerTier":"listed","pitch":"Historic inn dining — listed partner presence.","supportsCheckIn":true}'::jsonb),
    (st_clair, 'surfside-bar-grill', 'Surfside Bar & Grill', 'restaurant',
      'Near Belle Maer / Anchor Bay',
      ST_SetSRID(ST_MakePoint(-82.7875, 42.6155), 4326)::geography, 'verified', now(), 'active',
      '{"group":"dining","diningCategory":"bar","partner":true,"partnerTier":"listed","pitch":"Bay-side bar listing for post-raft crews.","supportsCheckIn":true}'::jsonb)
  on conflict (lake_id, slug) do update set
    name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    point = excluded.point,
    verification_status = excluded.verification_status,
    verified_at = excluded.verified_at,
    status = 'active',
    attributes = excluded.attributes;
end $$;
