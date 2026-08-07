-- DM helpers: find-or-create 1:1 conversation + allow members to bump updated_at

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

drop policy if exists "Update own conversations" on public.conversations;
create policy "Update own conversations" on public.conversations
  for update using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = id and m.profile_id = auth.uid()
    )
  );

drop policy if exists "Update own membership read cursor" on public.conversation_members;
create policy "Update own membership read cursor" on public.conversation_members
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
