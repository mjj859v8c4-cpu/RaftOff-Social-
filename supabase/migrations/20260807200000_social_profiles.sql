-- RaftOff Social — expanded profiles + social foundation
-- Every auth.users row gets a public.profiles row (trigger + backfill).

-- ---------------------------------------------------------------------------
-- Profile expansions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists home_city text,
  add column if not exists home_marina text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists identity_tags text[] not null default '{}',
  add column if not exists badges text[] not null default '{}',
  add column if not exists primary_boat_id uuid,
  add column if not exists profile_visibility text not null default 'everyone',
  add column if not exists message_privacy text not null default 'connections',
  add column if not exists show_on_water boolean not null default true,
  add column if not exists show_marina boolean not null default true,
  add column if not exists show_boat boolean not null default true,
  add column if not exists show_online boolean not null default false,
  add column if not exists allow_connection_requests boolean not null default true,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists profile_kind text not null default 'personal';

alter table public.profiles
  drop constraint if exists profiles_profile_visibility_check;
alter table public.profiles
  add constraint profiles_profile_visibility_check
  check (profile_visibility in ('everyone', 'members', 'connections'));

alter table public.profiles
  drop constraint if exists profiles_message_privacy_check;
alter table public.profiles
  add constraint profiles_message_privacy_check
  check (message_privacy in ('everyone', 'following', 'connections'));

alter table public.profiles
  drop constraint if exists profiles_profile_kind_check;
alter table public.profiles
  add constraint profiles_profile_kind_check
  check (profile_kind in ('personal', 'business', 'creator'));

-- ---------------------------------------------------------------------------
-- Boats / watercraft expansions
-- ---------------------------------------------------------------------------
alter table public.boats
  add column if not exists name text,
  add column if not exists manufacturer text,
  add column if not exists primary_color text,
  add column if not exists description text,
  add column if not exists home_marina text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill name from nickname
update public.boats set name = nickname where name is null;

-- ---------------------------------------------------------------------------
-- Interests catalog + user interests
-- ---------------------------------------------------------------------------
create table if not exists public.interests (
  id text primary key,
  label text not null,
  category text not null default 'general',
  sort_order integer not null default 100
);

insert into public.interests (id, label, category, sort_order) values
  ('sandbars', 'Sandbars', 'social', 10),
  ('fishing', 'Fishing', 'fishing', 20),
  ('bass-fishing', 'Bass Fishing', 'fishing', 21),
  ('walleye-fishing', 'Walleye Fishing', 'fishing', 22),
  ('muskie-fishing', 'Muskie Fishing', 'fishing', 23),
  ('offshore-fishing', 'Offshore Fishing', 'fishing', 24),
  ('cruising', 'Cruising', 'boating', 30),
  ('party-cove', 'Party Cove', 'social', 31),
  ('boat-meetups', 'Boat Meetups', 'social', 32),
  ('raft-ups', 'Raft Ups', 'social', 33),
  ('waterfront-restaurants', 'Waterfront Restaurants', 'social', 34),
  ('live-music', 'Live Music', 'social', 35),
  ('boat-shows', 'Boat Shows', 'boating', 36),
  ('watersports', 'Watersports', 'sports', 40),
  ('wakeboarding', 'Wakeboarding', 'sports', 41),
  ('wakesurfing', 'Wakesurfing', 'sports', 42),
  ('jet-skiing', 'Jet Skiing', 'sports', 43),
  ('sailing', 'Sailing', 'boating', 44),
  ('camping', 'Camping', 'lifestyle', 50),
  ('kayaking', 'Kayaking', 'sports', 51),
  ('family-boating', 'Family Boating', 'lifestyle', 52),
  ('sunset-cruises', 'Sunset Cruises', 'lifestyle', 53),
  ('poker-runs', 'Poker Runs', 'social', 54)
on conflict (id) do update set label = excluded.label, category = excluded.category, sort_order = excluded.sort_order;

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id text not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);
create index if not exists profile_interests_interest_idx on public.profile_interests(interest_id);

-- ---------------------------------------------------------------------------
-- Identity tags (boating identity) — stored on profiles.identity_tags
-- Reference list for clients
-- ---------------------------------------------------------------------------
create table if not exists public.identity_tag_catalog (
  id text primary key,
  label text not null,
  sort_order integer not null default 100
);

insert into public.identity_tag_catalog (id, label, sort_order) values
  ('boater', 'Boater', 10),
  ('fisherman', 'Fisherman', 20),
  ('jet-ski-rider', 'Jet Ski Rider', 30),
  ('sailor', 'Sailor', 40),
  ('kayaker', 'Kayaker', 50),
  ('paddleboarder', 'Paddleboarder', 60),
  ('wakeboarder', 'Wakeboarder', 70),
  ('wakesurfer', 'Wakesurfer', 80),
  ('pontoon-owner', 'Pontoon Owner', 90),
  ('yacht-owner', 'Yacht Owner', 100),
  ('marina-member', 'Marina Member', 110),
  ('lake-local', 'Lake Local', 120),
  ('weekend-warrior', 'Weekend Warrior', 130)
on conflict (id) do update set label = excluded.label;

-- ---------------------------------------------------------------------------
-- Profile gallery photos (ordered)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid references public.media_assets(id) on delete set null,
  url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists profile_photos_profile_idx
  on public.profile_photos(profile_id, sort_order);

-- ---------------------------------------------------------------------------
-- Mutual connections (in addition to existing follows)
-- ---------------------------------------------------------------------------
create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id),
  check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  unique (requester_id, recipient_id)
);
create index if not exists connection_requests_recipient_idx
  on public.connection_requests(recipient_id, status, created_at desc);

create table if not exists public.connections (
  profile_a uuid not null references public.profiles(id) on delete cascade,
  profile_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (profile_a < profile_b),
  primary key (profile_a, profile_b)
);
create index if not exists connections_b_idx on public.connections(profile_b);

-- ---------------------------------------------------------------------------
-- Temporary statuses
-- ---------------------------------------------------------------------------
create table if not exists public.user_statuses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  lake_id uuid references public.lakes(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  body text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists user_statuses_active_idx
  on public.user_statuses(profile_id, expires_at desc);

-- ---------------------------------------------------------------------------
-- Lake membership (home lake community)
-- ---------------------------------------------------------------------------
create table if not exists public.lake_members (
  lake_id uuid not null references public.lakes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (lake_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Crews / groups architecture (ready for later UI)
-- ---------------------------------------------------------------------------
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  lake_id uuid references public.lakes(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  cover_url text,
  visibility text not null default 'public',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (crew_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Direct messaging foundation
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_idx
  on public.messages(conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ensure profile on signup (improved) + backfill
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  display text;
begin
  base_username := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'boater'
  );
  final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  display := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    split_part(new.email, '@', 1),
    'Boater'
  );

  insert into public.profiles (
    id, username, display_name, email, role, badges, onboarding_completed
  )
  values (
    new.id,
    final_username,
    display,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    array['founding-member']::text[],
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth users missing a profile
insert into public.profiles (id, username, display_name, email, role, badges)
select
  u.id,
  coalesce(
    nullif(regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'boater'
  ) || '_' || substr(replace(u.id::text, '-', ''), 1, 6),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Boater'),
  u.email,
  'user',
  array['founding-member']::text[]
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Award founding badge to early profiles missing it
update public.profiles
set badges = array_append(badges, 'founding-member')
where not ('founding-member' = any (badges));

-- Sync lake_members when home_lake_id set
create or replace function public.sync_home_lake_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.home_lake_id is not null then
    insert into public.lake_members (lake_id, profile_id)
    values (new.home_lake_id, new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_home_lake on public.profiles;
create trigger profiles_sync_home_lake
  after insert or update of home_lake_id on public.profiles
  for each row execute function public.sync_home_lake_membership();

-- Accept connection helper: creates undirected edge + notifies
create or replace function public.accept_connection_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.connection_requests%rowtype;
  a uuid;
  b uuid;
begin
  select * into req from public.connection_requests where id = request_id for update;
  if not found then
    raise exception 'request not found';
  end if;
  if req.recipient_id <> auth.uid() then
    raise exception 'not recipient';
  end if;
  if req.status <> 'pending' then
    raise exception 'not pending';
  end if;

  update public.connection_requests
  set status = 'accepted', responded_at = now()
  where id = request_id;

  a := least(req.requester_id, req.recipient_id);
  b := greatest(req.requester_id, req.recipient_id);
  insert into public.connections (profile_a, profile_b)
  values (a, b)
  on conflict do nothing;

  insert into public.notifications (user_id, actor_id, type, title, body, target_type, target_id)
  values (
    req.requester_id,
    req.recipient_id,
    'connection_accepted',
    'Connection accepted',
    'You’re now connected on RaftOff.',
    'profile',
    req.recipient_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.identity_tag_catalog enable row level security;
alter table public.profile_photos enable row level security;
alter table public.connection_requests enable row level security;
alter table public.connections enable row level security;
alter table public.user_statuses enable row level security;
alter table public.lake_members enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "Anyone read interests" on public.interests for select using (true);
create policy "Anyone read identity tags" on public.identity_tag_catalog for select using (true);

create policy "Read profile interests" on public.profile_interests for select using (true);
create policy "Manage own interests" on public.profile_interests
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Read profile photos" on public.profile_photos for select using (true);
create policy "Manage own profile photos" on public.profile_photos
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Read own connection requests" on public.connection_requests
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);
create policy "Create connection requests" on public.connection_requests
  for insert with check (auth.uid() = requester_id);
create policy "Update own connection requests" on public.connection_requests
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Read connections" on public.connections for select using (true);
create policy "Delete own connections" on public.connections
  for delete using (auth.uid() = profile_a or auth.uid() = profile_b);

create policy "Read active statuses" on public.user_statuses
  for select using (expires_at > now() or profile_id = auth.uid());
create policy "Manage own statuses" on public.user_statuses
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Read lake members" on public.lake_members for select using (true);
create policy "Join lakes as self" on public.lake_members
  for insert with check (auth.uid() = profile_id);
create policy "Leave lakes as self" on public.lake_members
  for delete using (auth.uid() = profile_id);

create policy "Read public crews" on public.crews for select using (true);
create policy "Read crew members" on public.crew_members for select using (true);

create policy "Read own conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = id and m.profile_id = auth.uid()
    )
  );
create policy "Read own conversation membership" on public.conversation_members
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_id and m.profile_id = auth.uid()
    )
  );
create policy "Read messages in my conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid()
    )
  );
create policy "Send messages in my conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_id and m.profile_id = auth.uid()
    )
  );

-- FK for primary boat (after boats exist)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_primary_boat_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_primary_boat_id_fkey
      foreign key (primary_boat_id) references public.boats(id) on delete set null;
  end if;
end $$;
