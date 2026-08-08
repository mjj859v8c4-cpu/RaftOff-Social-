-- Private crews linked to group conversations + mutual captains lookup.

-- ---------------------------------------------------------------------------
-- Conversations: DM vs group (crew chat)
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column if not exists kind text not null default 'dm',
  add column if not exists title text,
  add column if not exists crew_id uuid references public.crews(id) on delete set null;

alter table public.conversations
  drop constraint if exists conversations_kind_check;
alter table public.conversations
  add constraint conversations_kind_check check (kind in ('dm', 'group'));

create index if not exists conversations_crew_idx on public.conversations(crew_id);

alter table public.crews
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

alter table public.crews
  drop constraint if exists crews_visibility_check;
alter table public.crews
  add constraint crews_visibility_check check (visibility in ('public', 'private'));

-- Private crews: members + creator only
drop policy if exists "Read public crews" on public.crews;
create policy "Read crews" on public.crews
  for select using (
    visibility = 'public'
    or created_by = auth.uid()
    or exists (
      select 1 from public.crew_members cm
      where cm.crew_id = id and cm.profile_id = auth.uid()
    )
  );

drop policy if exists "Update own crews" on public.crews;
create policy "Update own crews" on public.crews
  for update using (
    created_by = auth.uid()
    or exists (
      select 1 from public.crew_members cm
      where cm.crew_id = id and cm.profile_id = auth.uid() and cm.role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- DM helper — only match 1:1 dm threads (not group chats)
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_dm(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'invalid peer';
  end if;

  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  join public.conversations c on c.id = cm1.conversation_id
  where cm1.profile_id = me
    and cm2.profile_id = other_id
    and c.kind = 'dm'
    and (
      select count(*)::int
      from public.conversation_members cm3
      where cm3.conversation_id = cm1.conversation_id
    ) = 2
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations (kind) values ('dm')
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, profile_id)
  values (conv_id, me), (conv_id, other_id);

  return conv_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Mutual captains — avatars for profile / mini-profile UX
-- ---------------------------------------------------------------------------
create or replace function public.mutual_connections(other uuid, p_limit integer default 6)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  with mine as (
    select case when profile_a = auth.uid() then profile_b else profile_a end as pid
    from public.connections
    where profile_a = auth.uid() or profile_b = auth.uid()
  ),
  theirs as (
    select case when profile_a = other then profile_b else profile_a end as pid
    from public.connections
    where profile_a = other or profile_b = other
  )
  select p.id, p.username, p.display_name, p.avatar_url
  from mine
  join theirs using (pid)
  join public.profiles p on p.id = mine.pid
  where p.is_blocked = false
  order by p.display_name asc
  limit greatest(1, least(p_limit, 12));
$$;

grant execute on function public.mutual_connections(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Private crew + linked group chat
-- ---------------------------------------------------------------------------
create or replace function public.create_private_crew(
  p_name text,
  p_description text default null,
  p_lake_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  crew_id uuid;
  conv_id uuid;
  slug_base text;
  slug_final text;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'crew name required';
  end if;

  slug_base := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'g'));
  slug_base := trim(both '-' from slug_base);
  slug_final := coalesce(nullif(slug_base, ''), 'crew') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);

  insert into public.conversations (kind, title)
  values ('group', trim(p_name))
  returning id into conv_id;

  insert into public.crews (lake_id, slug, name, description, visibility, created_by, conversation_id)
  values (p_lake_id, slug_final, trim(p_name), nullif(trim(p_description), ''), 'private', me, conv_id)
  returning id into crew_id;

  update public.conversations set crew_id = crew_id where id = conv_id;

  insert into public.crew_members (crew_id, profile_id, role)
  values (crew_id, me, 'owner');

  insert into public.conversation_members (conversation_id, profile_id)
  values (conv_id, me);

  return crew_id;
end;
$$;

grant execute on function public.create_private_crew(text, text, uuid) to authenticated;

-- Invite a connection into a private crew + group chat (owner/admin only)
create or replace function public.invite_to_crew(p_crew_id uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
  a uuid;
  b uuid;
  connected boolean;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if p_profile_id is null or p_profile_id = me then
    raise exception 'invalid invitee';
  end if;

  if not exists (
    select 1 from public.crew_members
    where crew_id = p_crew_id and profile_id = me and role in ('owner', 'admin')
  ) then
    raise exception 'not authorized to invite';
  end if;

  select conversation_id into conv_id from public.crews where id = p_crew_id;
  if conv_id is null then
    raise exception 'crew chat not found';
  end if;

  a := least(me, p_profile_id);
  b := greatest(me, p_profile_id);
  select exists(
    select 1 from public.connections where profile_a = a and profile_b = b
  ) into connected;
  if not connected then
    raise exception 'can only invite connections';
  end if;

  insert into public.crew_members (crew_id, profile_id, role)
  values (p_crew_id, p_profile_id, 'member')
  on conflict do nothing;

  insert into public.conversation_members (conversation_id, profile_id)
  values (conv_id, p_profile_id)
  on conflict do nothing;
end;
$$;

grant execute on function public.invite_to_crew(uuid, uuid) to authenticated;
