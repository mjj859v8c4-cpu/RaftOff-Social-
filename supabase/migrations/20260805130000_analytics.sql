-- Commercial analytics events (first-party). Place-level props only — no private GPS.
create table if not exists public.analytics_events (
  id bigserial primary key,
  event_id text unique not null,
  name text not null,
  ts timestamptz not null,
  session_id text not null,
  anon_id text not null,
  platform text not null,
  hour_bucket smallint not null check (hour_bucket between 0 and 23),
  dow smallint not null check (dow between 0 and 6),
  commercial_ok boolean not null default true,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_ts_idx on public.analytics_events (ts desc);
create index if not exists analytics_events_name_idx on public.analytics_events (name, ts desc);
create index if not exists analytics_events_commercial_idx
  on public.analytics_events (commercial_ok, ts desc)
  where commercial_ok = true;
create index if not exists analytics_events_props_gin on public.analytics_events using gin (props);

alter table public.analytics_events enable row level security;

-- Anon clients may insert their own product events; no public read of raw rows.
drop policy if exists analytics_insert_anon on public.analytics_events;
create policy analytics_insert_anon
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

-- Aggregated commercial view (service role / dashboard only via grants)
create or replace view public.analytics_location_heat as
select
  props->>'location_slug' as location_slug,
  props->>'location_type' as location_type,
  count(*)::int as touches,
  date_trunc('day', ts) as day
from public.analytics_events
where commercial_ok = true
  and props ? 'location_slug'
group by 1, 2, 4;

create or replace view public.analytics_vibe_mix as
select
  props->>'vibe' as vibe,
  hour_bucket,
  count(*)::int as touches
from public.analytics_events
where commercial_ok = true
  and props ? 'vibe'
group by 1, 2;

revoke all on public.analytics_location_heat from anon, authenticated;
revoke all on public.analytics_vibe_mix from anon, authenticated;
