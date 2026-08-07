-- RaftOff Social — Phase 5/6: posts/feed richness + connection activity + notification hooks
-- Idempotent: safe to run even if some pieces already landed from a parallel migration.

-- ---------------------------------------------------------------------------
-- Posts: multi-photo support (keeps existing single photo_url for back-compat)
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists photo_urls text[] not null default '{}';

create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);
create index if not exists boats_owner_created_idx on public.boats(owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Post saves (bookmarks) — table may already exist from a parallel migration;
-- this only ensures shape, indexes, RLS are complete.
-- ---------------------------------------------------------------------------
create table if not exists public.post_saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists post_saves_profile_idx on public.post_saves(profile_id, created_at desc);

alter table public.post_saves enable row level security;
drop policy if exists "Read own saves" on public.post_saves;
create policy "Read own saves" on public.post_saves
  for select using (auth.uid() = profile_id);
drop policy if exists "Save posts as self" on public.post_saves;
create policy "Save posts as self" on public.post_saves
  for insert with check (auth.uid() = profile_id);
drop policy if exists "Unsave own posts" on public.post_saves;
create policy "Unsave own posts" on public.post_saves
  for delete using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Event attendees (actual attendance, distinct from RSVP intent)
-- ---------------------------------------------------------------------------
create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index if not exists event_attendees_profile_idx on public.event_attendees(profile_id, created_at desc);

alter table public.event_attendees enable row level security;
drop policy if exists "Read event attendees" on public.event_attendees;
create policy "Read event attendees" on public.event_attendees for select using (true);
drop policy if exists "Check in as self" on public.event_attendees;
create policy "Check in as self" on public.event_attendees
  for insert with check (auth.uid() = profile_id);
drop policy if exists "Remove own attendance" on public.event_attendees;
create policy "Remove own attendance" on public.event_attendees
  for delete using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Storage: post photos bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read post photos" on storage.objects;
create policy "Public read post photos"
  on storage.objects for select using (bucket_id = 'post-photos');
drop policy if exists "Users upload own post photos" on storage.objects;
create policy "Users upload own post photos"
  on storage.objects for insert with check (
    bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "Users update own post photos" on storage.objects;
create policy "Users update own post photos"
  on storage.objects for update using (
    bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "Users delete own post photos" on storage.objects;
create policy "Users delete own post photos"
  on storage.objects for delete using (
    bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Notification hooks: like + comment (connection request/accept already notify)
-- SECURITY DEFINER so the notification can be written for the recipient, not
-- just the acting user — same pattern as accept_connection_request().
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if new.reaction <> 'like' then
    return new;
  end if;
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is null or v_author = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, actor_id, type, title, body, target_type, target_id)
  values (v_author, new.user_id, 'post_like', 'New like', 'Someone liked your post.', 'post', new.post_id);
  return new;
end;
$$;

drop trigger if exists reactions_notify on public.reactions;
create trigger reactions_notify
  after insert on public.reactions
  for each row execute function public.notify_on_reaction();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is null or v_author = new.author_id then
    return new;
  end if;
  insert into public.notifications (user_id, actor_id, type, title, body, target_type, target_id)
  values (
    v_author,
    new.author_id,
    'post_comment',
    'New comment',
    left(coalesce(new.text, ''), 120),
    'post',
    new.post_id
  );
  return new;
end;
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();
