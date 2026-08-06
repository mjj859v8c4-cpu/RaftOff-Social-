-- RaftOff Social — production schema completion
-- Followers, notifications, media, admin, rate limits, full RLS, storage

-- ---------------------------------------------------------------------------
-- Profile / boat extensions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text,
  add column if not exists role text not null default 'user',
  add column if not exists is_blocked boolean not null default false,
  add column if not exists push_token text,
  add column if not exists analytics_consent boolean not null default false,
  add column if not exists marketing_consent boolean not null default false;

alter table public.boats
  add column if not exists length_ft numeric,
  add column if not exists make text,
  add column if not exists model text,
  add column if not exists year integer;

alter table public.posts
  add column if not exists photo_url text;

alter table public.events
  add column if not exists cover_photo_url text,
  add column if not exists capacity integer;

alter table public.check_ins
  add column if not exists photo_url text;

alter table public.reports
  add column if not exists notes text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Followers
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  target_type text,
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Media assets (normalized photo records)
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  path text not null,
  mime_type text,
  byte_size integer,
  width integer,
  height integer,
  purpose text not null, -- profile | boat | check_in | event | post
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists media_owner_idx on public.media_assets(owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Moderation queue (admin)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null, -- hide_post | restore_post | ban_user | unban_user | resolve_report
  target_type text not null,
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rate limiting (server-side counters)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  id text primary key, -- e.g. user:uuid:check_in:2026-08-06T12
  hits integer not null default 0,
  window_starts_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
  window_start timestamptz;
begin
  select hits, window_starts_at into current_hits, window_start
  from public.rate_limits where id = p_key for update;

  if not found then
    insert into public.rate_limits(id, hits, window_starts_at)
    values (p_key, 1, now());
    return true;
  end if;

  if window_start < now() - make_interval(secs => p_window_seconds) then
    update public.rate_limits
    set hits = 1, window_starts_at = now(), updated_at = now()
    where id = p_key;
    return true;
  end if;

  if current_hits >= p_limit then
    return false;
  end if;

  update public.rate_limits
  set hits = hits + 1, updated_at = now()
  where id = p_key;
  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile on signup
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
begin
  base_username := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'boater'
  );
  final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name, email, role)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Boater'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: is_admin
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator')
  );
$$;

-- ---------------------------------------------------------------------------
-- Fix check_ins SELECT so private_position is never readable by peers
-- ---------------------------------------------------------------------------
drop policy if exists "Read public active check-ins" on public.check_ins;
-- Owners can read own rows (including private_position); peers use check_ins_public view
create policy "Read own check-ins" on public.check_ins
  for select using (auth.uid() = user_id);

create policy "Admins read all check-ins" on public.check_ins
  for select using (public.is_admin());

grant select on public.check_ins_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Complete RLS policies
-- ---------------------------------------------------------------------------
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.media_assets enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.rate_limits enable row level security;

-- Profiles
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles
  for select using (is_blocked = false or auth.uid() = id or public.is_admin());

create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- Boats
create policy "Read public boats" on public.boats
  for select using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.is_admin()
  );
create policy "Insert own boats" on public.boats
  for insert with check (auth.uid() = owner_id);
create policy "Update own boats" on public.boats
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "Delete own boats" on public.boats
  for delete using (auth.uid() = owner_id or public.is_admin());

-- RSVPs
create policy "Read rsvps" on public.rsvps for select using (true);
create policy "Insert own rsvp" on public.rsvps
  for insert with check (auth.uid() = user_id);
create policy "Update own rsvp" on public.rsvps
  for update using (auth.uid() = user_id);
create policy "Delete own rsvp" on public.rsvps
  for delete using (auth.uid() = user_id);

-- Reactions
create policy "Read reactions" on public.reactions for select using (true);
create policy "Insert own reaction" on public.reactions
  for insert with check (auth.uid() = user_id);
create policy "Delete own reaction" on public.reactions
  for delete using (auth.uid() = user_id);

-- Comments
create policy "Read comments" on public.comments
  for select using (deleted_at is null or author_id = auth.uid() or public.is_admin());
create policy "Insert own comment" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "Update own comment" on public.comments
  for update using (auth.uid() = author_id or public.is_admin());

-- Blocks
create policy "Read own blocks" on public.blocks
  for select using (auth.uid() = blocker_id or public.is_admin());
create policy "Insert own block" on public.blocks
  for insert with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
create policy "Delete own block" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- Reports
create policy "Insert own report" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "Read own or admin reports" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());
create policy "Admin update reports" on public.reports
  for update using (public.is_admin());

-- Follows
create policy "Read follows" on public.follows for select using (true);
create policy "Insert own follow" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "Delete own follow" on public.follows
  for delete using (auth.uid() = follower_id);

-- Notifications
create policy "Read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Insert notifications authenticated" on public.notifications
  for insert with check (auth.uid() = user_id or public.is_admin());

-- Media
create policy "Read media" on public.media_assets for select using (true);
create policy "Insert own media" on public.media_assets
  for insert with check (auth.uid() = owner_id);
create policy "Delete own media" on public.media_assets
  for delete using (auth.uid() = owner_id or public.is_admin());

-- Moderation actions (admin only)
create policy "Admin read moderation" on public.moderation_actions
  for select using (public.is_admin());
create policy "Admin insert moderation" on public.moderation_actions
  for insert with check (public.is_admin());

-- Rate limits: no direct client access
create policy "No client rate_limits" on public.rate_limits
  for all using (false) with check (false);

-- Posts / events extras
create policy "Update own posts" on public.posts
  for update using (auth.uid() = author_id or public.is_admin());
create policy "Update own events" on public.events
  for update using (auth.uid() = organizer_id or public.is_admin());

-- Analytics: tighten insert (require anon/auth but capped via edge later)
drop policy if exists "analytics_insert_anon" on public.analytics_events;
create policy "analytics_insert" on public.analytics_events
  for insert with check (true);
create policy "Admin read analytics" on public.analytics_events
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('boat-photos', 'boat-photos', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('check-in-photos', 'check-in-photos', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('event-photos', 'event-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
create policy "Public read profile photos"
  on storage.objects for select using (bucket_id = 'profile-photos');
create policy "Users upload own profile photos"
  on storage.objects for insert with check (
    bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users update own profile photos"
  on storage.objects for update using (
    bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users delete own profile photos"
  on storage.objects for delete using (
    bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read boat photos"
  on storage.objects for select using (bucket_id = 'boat-photos');
create policy "Users upload own boat photos"
  on storage.objects for insert with check (
    bucket_id = 'boat-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users update own boat photos"
  on storage.objects for update using (
    bucket_id = 'boat-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users delete own boat photos"
  on storage.objects for delete using (
    bucket_id = 'boat-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read check-in photos"
  on storage.objects for select using (bucket_id = 'check-in-photos');
create policy "Users upload own check-in photos"
  on storage.objects for insert with check (
    bucket_id = 'check-in-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users update own check-in photos"
  on storage.objects for update using (
    bucket_id = 'check-in-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users delete own check-in photos"
  on storage.objects for delete using (
    bucket_id = 'check-in-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read event photos"
  on storage.objects for select using (bucket_id = 'event-photos');
create policy "Users upload own event photos"
  on storage.objects for insert with check (
    bucket_id = 'event-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users update own event photos"
  on storage.objects for update using (
    bucket_id = 'event-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users delete own event photos"
  on storage.objects for delete using (
    bucket_id = 'event-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Location feed RPC (blocks + moderation aware)
-- ---------------------------------------------------------------------------
create or replace function public.location_feed(p_location_id uuid, p_limit integer default 40)
returns table (
  post_id uuid,
  author_id uuid,
  text text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint
)
language sql
stable
security invoker
as $$
  select
    p.id,
    p.author_id,
    p.text,
    p.created_at,
    (select count(*) from public.reactions r where r.post_id = p.id and r.reaction = 'like'),
    (select count(*) from public.comments c where c.post_id = p.id and c.deleted_at is null)
  from public.posts p
  where p.location_id = p_location_id
    and p.deleted_at is null
    and p.moderation_status = 'visible'
    and p.audience = 'public'
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = p.author_id
    )
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = p.author_id and b.blocked_id = auth.uid()
    )
  order by p.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.location_feed(uuid, integer) to anon, authenticated;
