-- Viewport / nearest helpers for Lake St. Clair locations
create or replace function public.locations_in_bbox(
  p_lake_id uuid,
  west double precision,
  south double precision,
  east double precision,
  north double precision
)
returns setof public.locations
language sql
stable
security invoker
as $$
  select l.*
  from public.locations l
  where l.lake_id = p_lake_id
    and l.status = 'active'
    and l.point is not null
    and ST_Intersects(
      l.point::geometry,
      ST_MakeEnvelope(west, south, east, north, 4326)
    );
$$;

create or replace function public.nearest_locations(
  p_lake_id uuid,
  lng double precision,
  lat double precision,
  p_limit int default 10
)
returns setof public.locations
language sql
stable
security invoker
as $$
  select l.*
  from public.locations l
  where l.lake_id = p_lake_id
    and l.status = 'active'
    and l.point is not null
  order by l.point <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  limit p_limit;
$$;
