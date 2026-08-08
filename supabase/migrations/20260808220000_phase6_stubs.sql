-- Phase 6 user-facing stubs: event RSVP (going/interested), crews join/leave,
-- lake community hub. No new tables — reuses rsvps.state, crews, crew_members,
-- lake_members from prior migrations.

-- ---------------------------------------------------------------------------
-- RSVPs: constrain state to the two values the UI supports.
-- ---------------------------------------------------------------------------
update public.rsvps set state = 'going' where state not in ('going', 'interested');

alter table public.rsvps
  drop constraint if exists rsvps_state_check;
alter table public.rsvps
  add constraint rsvps_state_check check (state in ('going', 'interested'));

create index if not exists rsvps_event_state_idx on public.rsvps(event_id, state);
create index if not exists rsvps_user_idx on public.rsvps(user_id);

-- ---------------------------------------------------------------------------
-- Crews: allow members to create crews and join/leave crews they can see.
-- (Read policies already exist from 20260807200000_social_profiles.sql.)
-- ---------------------------------------------------------------------------
drop policy if exists "Create crews as self" on public.crews;
create policy "Create crews as self" on public.crews
  for insert with check (auth.uid() = created_by);

drop policy if exists "Join crew as self" on public.crew_members;
create policy "Join crew as self" on public.crew_members
  for insert with check (auth.uid() = profile_id);

drop policy if exists "Leave crew as self" on public.crew_members;
create policy "Leave crew as self" on public.crew_members
  for delete using (auth.uid() = profile_id);

create index if not exists crew_members_profile_idx on public.crew_members(profile_id);
create index if not exists crews_lake_idx on public.crews(lake_id);
