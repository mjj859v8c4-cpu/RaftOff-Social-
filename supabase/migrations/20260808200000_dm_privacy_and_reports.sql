-- Enforce DM privacy + blocks in get_or_create_dm; report categories.

alter table public.reports
  add column if not exists category text;

alter table public.reports
  drop constraint if exists reports_category_check;
alter table public.reports
  add constraint reports_category_check
  check (
    category is null
    or category in (
      'spam',
      'harassment',
      'fake_profile',
      'inappropriate_content',
      'unsafe_activity',
      'other'
    )
  );

create or replace function public.get_or_create_dm(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
  peer_privacy text;
  i_follow boolean;
  we_connected boolean;
  blocked boolean;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'invalid peer';
  end if;

  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = me and b.blocked_id = other_id)
       or (b.blocker_id = other_id and b.blocked_id = me)
  ) into blocked;
  if blocked then
    raise exception 'messaging blocked';
  end if;

  select coalesce(p.message_privacy, 'connections')
  into peer_privacy
  from public.profiles p
  where p.id = other_id;

  if peer_privacy is null then
    raise exception 'profile not found';
  end if;

  select exists (
    select 1 from public.connections c
    where (c.profile_a = least(me, other_id) and c.profile_b = greatest(me, other_id))
  ) into we_connected;

  select exists (
    select 1 from public.follows f
    where f.follower_id = me and f.following_id = other_id
  ) into i_follow;

  if peer_privacy = 'connections' and not we_connected then
    raise exception 'messaging restricted to connections';
  end if;
  if peer_privacy = 'following' and not (we_connected or i_follow) then
    raise exception 'messaging restricted';
  end if;

  select cm1.conversation_id into conv_id
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.profile_id = me
    and cm2.profile_id = other_id
    and (
      select count(*)::int
      from public.conversation_members cm3
      where cm3.conversation_id = cm1.conversation_id
    ) = 2
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, profile_id)
  values (conv_id, me), (conv_id, other_id);

  return conv_id;
end;
$$;

grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- The original policies below used an unqualified `conversation_id` inside a
-- correlated subquery on `conversation_members m`; Postgres binds that name to
-- `m.conversation_id` (the closest scope) instead of the outer row, so the
-- exists() check degenerated into "the user belongs to *some* conversation" —
-- letting any member read every conversation's membership list and insert
-- messages into conversations they don't belong to. Qualify every reference to
-- the outer row explicitly, and reject sends between blocked users so a block
-- placed after a thread already exists still stops new messages.
drop policy if exists "Read own conversation membership" on public.conversation_members;
create policy "Read own conversation membership" on public.conversation_members
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_members.conversation_id
        and m.profile_id = auth.uid()
    )
  );

drop policy if exists "Send messages in my conversations" on public.messages;
create policy "Send messages in my conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id
        and m.profile_id = auth.uid()
    )
    and not exists (
      select 1
      from public.conversation_members other
      join public.blocks b
        on (b.blocker_id = auth.uid() and b.blocked_id = other.profile_id)
        or (b.blocker_id = other.profile_id and b.blocked_id = auth.uid())
      where other.conversation_id = messages.conversation_id
        and other.profile_id <> auth.uid()
    )
  );
