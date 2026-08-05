-- RaftOff Social — Milestone 1 foundation schema
create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.location_type as enum (
  'social_sandbar', 'social_island', 'social_bay', 'social_zone',
  'event_zone', 'region', 'channel', 'channel_mouth', 'fishing_zone',
  'park', 'waterfront_district', 'boat_launch', 'marina',
  'restaurant', 'fuel', 'bait', 'marine_service'
);

create table public.lakes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  timezone text not null,
  boundary geography(multipolygon, 4326),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  home_lake_id uuid references public.lakes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.boats (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  boat_type text,
  photo_url text,
  visibility text not null default 'public',
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  lake_id uuid not null references public.lakes(id) on delete cascade,
  slug text not null,
  name text not null,
  type public.location_type not null,
  point geography(point, 4326),
  boundary geography(multipolygon, 4326),
  default_radius_m integer,
  description text,
  public_access boolean,
  resident_only boolean default false,
  fee_required boolean,
  seasonal boolean default false,
  attributes jsonb not null default '{}'::jsonb,
  source_url text,
  verified_at timestamptz,
  verification_status text not null default 'needs_review',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lake_id, slug)
);

create index locations_point_gix on public.locations using gist(point);
create index locations_boundary_gix on public.locations using gist(boundary);
create index locations_lake_type_idx on public.locations(lake_id, type, status);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  boat_id uuid references public.boats(id),
  lake_id uuid not null references public.lakes(id),
  location_id uuid references public.locations(id),
  private_position geography(point, 4326),
  public_position geography(point, 4326),
  vibe text not null,
  message text,
  audience text not null default 'public',
  precision text not null default 'location',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index check_ins_active_idx on public.check_ins(lake_id, status, expires_at);
create index check_ins_location_idx on public.check_ins(location_id, status);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  lake_id uuid not null references public.lakes(id),
  location_id uuid references public.locations(id),
  check_in_id uuid references public.check_ins(id),
  event_id uuid,
  post_type text not null default 'standard',
  text text,
  audience text not null default 'public',
  moderation_status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id),
  lake_id uuid not null references public.lakes(id),
  location_id uuid references public.locations(id),
  title text not null,
  description text,
  category text not null default 'chill',
  starts_at timestamptz not null,
  ends_at timestamptz,
  visibility text not null default 'public',
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  state text not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.boats enable row level security;
alter table public.lakes enable row level security;
alter table public.locations enable row level security;
alter table public.check_ins enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "Public read lakes" on public.lakes for select using (status = 'active');
create policy "Public read active locations" on public.locations for select using (status = 'active');
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Read public active check-ins" on public.check_ins
  for select using (
    status = 'active'
    and expires_at > now()
    and ended_at is null
    and audience = 'public'
    and precision <> 'hidden'
  );

create policy "Insert own check-ins" on public.check_ins
  for insert with check (auth.uid() = user_id);

create policy "Update own check-ins" on public.check_ins
  for update using (auth.uid() = user_id);

create policy "Read visible posts" on public.posts
  for select using (
    deleted_at is null
    and moderation_status = 'visible'
    and audience = 'public'
  );

create policy "Insert own posts" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "Read public events" on public.events
  for select using (visibility = 'public' and status <> 'canceled');

create policy "Insert own events" on public.events
  for insert with check (auth.uid() = organizer_id);

-- Never expose private_position via a public view
create or replace view public.check_ins_public as
select
  id, user_id, boat_id, lake_id, location_id,
  public_position, vibe, message, audience, precision,
  starts_at, expires_at, ended_at, status, created_at
from public.check_ins
where status = 'active'
  and expires_at > now()
  and ended_at is null
  and precision <> 'hidden';

-- Helper: expire check-ins
create or replace function public.expire_check_ins()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  update public.check_ins
  set status = 'expired'
  where status = 'active'
    and ended_at is null
    and expires_at <= now();
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
