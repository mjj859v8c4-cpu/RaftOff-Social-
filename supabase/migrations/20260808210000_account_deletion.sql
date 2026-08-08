-- Self-service account deletion: soft-disable profile, scrub PII, hide from public reads.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles
  for select using (
    (is_blocked = false and deleted_at is null)
    or auth.uid() = id
    or public.is_admin()
  );

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set
    deleted_at = now(),
    display_name = 'Deleted user',
    bio = null,
    avatar_url = null,
    cover_url = null,
    home_city = null,
    home_marina = null,
    identity_tags = '{}',
    show_in_discovery = false,
    show_on_water = false,
    show_marina = false,
    show_boat = false,
    show_online = false,
    allow_connection_requests = false,
    profile_visibility = 'connections',
    updated_at = now()
  where id = me;

  delete from public.profile_photos where profile_id = me;
  delete from public.user_statuses where profile_id = me;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
