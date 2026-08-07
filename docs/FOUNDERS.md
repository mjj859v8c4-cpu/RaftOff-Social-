# Founders & early crew

## Story (canonical)

CJ thought of RaftOff in bed one day. Three years later he met DJ, who is an expert in technology. Together they created RaftOff Social because of their love for lakes, parties, and rafting off on Lake St. Clair.

DJ and CJ are the **first users / founders**.

Marketing page: [`web/about.html`](../web/about.html) → https://raftoffsocial.com/about.html

## Who appears where

| Person | Role | About Us | App badges |
|--------|------|----------|------------|
| **CJ** (`@cj`) | Co-founder · CEO · vision | Founders section | `creator`, `co-founder` (+ `founding-member`) |
| **DJ** (`@dj`) | Co-founder · tech · first user | Founders section | `creator`, `co-founder` (+ `founding-member`) |
| **Gianna** | Early RaftOff crew | Crew section + `web/images/founders/gianna.jpg` | — |
| **Lauren** | Early RaftOff crew | Crew section + `web/images/founders/lauren.jpg` | — |

## Badge ids (DJ & CJ)

| Id | UI label | Notes |
|----|----------|-------|
| `creator` | **Creator** | Distinct coral chip — creators of RaftOff Social |
| `co-founder` | **Co-founder** | Distinct coral chip |
| `founder` | Founder | Legacy alias; UI hides if `co-founder` present |
| `founding-member` | Founding | Broader early cohort badge |

Rendered by [`components/profile/ProfileBadges.tsx`](../components/profile/ProfileBadges.tsx) on:

- Own profile: `app/(tabs)/profile.tsx`
- Public profile: `app/u/[username].tsx`

## Migrations

- `supabase/migrations/20260807235000_founder_profiles.sql`
- `supabase/migrations/20260807236000_creator_badges.sql`

Apply:

```bash
npx supabase db push --linked
```

## Claiming @dj / @cj after signup

`profiles.id` references `auth.users` — migrations cannot invent logins.

1. Create Auth users for DJ and CJ (Dashboard or invite).
2. Set usernames to `dj` / `cj` (or display names `DJ` / `CJ`).
3. Push migrations (or run SQL below).

```sql
update public.profiles
set username = 'dj', display_name = 'DJ', is_verified = true,
    badges = array['creator', 'co-founder', 'founding-member'],
    bio = 'Co-creator of RaftOff Social. Tech expert who met CJ and shipped the app for lakes, parties, and rafting off on St. Clair.'
where id = '<DJ_AUTH_USER_UUID>';

update public.profiles
set username = 'cj', display_name = 'CJ', is_verified = true,
    badges = array['creator', 'co-founder', 'founding-member'],
    bio = 'Thought of RaftOff in bed one day. Three years later met DJ and built RaftOff Social — lakes, parties, rafting off on St. Clair.'
where id = '<CJ_AUTH_USER_UUID>';
```

## Checklist

- [ ] Create DJ + CJ auth users; claim `dj` / `cj`
- [ ] Confirm Creator + Co-founder chips on Profile + `/u/dj` · `/u/cj`
- [ ] About page live with Gianna & Lauren portraits
