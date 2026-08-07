# Founders — DJ & CJ

RaftOff’s first two people on the water are **DJ** (`@dj`) and **CJ** (`@cj`).

## Story (canonical)

CJ thought of RaftOff in bed one day. Three years later he met DJ, who is an expert in technology. Together they created RaftOff Social because of their love for lakes, parties, and RaftOff on Lake St. Clair.

| Handle | Display | Role | Default bio (seed) | Badges |
|--------|---------|------|--------------------|--------|
| `cj` | CJ | Co-founder · CEO · the vision | Thought of RaftOff in bed one day. Three years later linked with DJ and built RaftOff Social — lakes, parties, St. Clair. | `creator`, `founder`, `founding-member` |
| `dj` | DJ | Co-founder · tech · first user | Tech with the bag. Met CJ, shipped RaftOff Social for lakes, parties, and St. Clair raft-ups. First on the water. | `creator`, `founder`, `founding-member` |

- Marketing story: [`web/about.html`](../web/about.html) → https://raftoffsocial.com/about.html
- In-app badges: `components/profile/ProfileBadges.tsx` on own profile + `app/u/[username].tsx`

## Badge ids

| Id | Meaning | Who |
|----|---------|-----|
| `creator` | Created RaftOff Social | DJ + CJ only |
| `founder` | Founder | DJ + CJ only |
| `founding-member` | Early launch member | Broader early cohort (also on DJ/CJ) |

Migrations:

- `supabase/migrations/20260807235000_founder_profiles.sql`
- `supabase/migrations/20260807236000_creator_badges.sql`

## Why no auth seed in migrations

`public.profiles.id` references `auth.users(id)`. Migrations cannot invent real login accounts without passwords or invite tokens. Instead:

1. Create the two accounts in Supabase Auth (Dashboard → Authentication → Users, or invite email).
2. Prefer signup metadata so the trigger creates clean profiles:

```json
{
  "display_name": "DJ"
}
```

(and `"display_name": "CJ"` for CJ).

3. Set usernames to `dj` / `cj`, then push founder migrations:

```bash
npx supabase db push --linked
```

Optional one-shot after both accounts exist (SQL editor):

```sql
update public.profiles
set username = 'dj', display_name = 'DJ', is_verified = true,
    badges = array['creator', 'founder', 'founding-member'],
    bio = 'Tech with the bag. Met CJ, shipped RaftOff Social for lakes, parties, and St. Clair raft-ups. First on the water.'
where id = '<DJ_AUTH_USER_UUID>';

update public.profiles
set username = 'cj', display_name = 'CJ', is_verified = true,
    badges = array['creator', 'founder', 'founding-member'],
    bio = 'Thought of RaftOff in bed one day. Three years later linked with DJ and built RaftOff Social — lakes, parties, St. Clair.'
where id = '<CJ_AUTH_USER_UUID>';
```

## Checklist

- [ ] Create DJ auth user; username `dj`
- [ ] Create CJ auth user; username `cj`
- [ ] Confirm `creator` + `founder` + `founding-member` and `is_verified`
- [ ] Badges visible on Profile tab and `/u/dj` · `/u/cj`
- [ ] About page live: `/about.html`
