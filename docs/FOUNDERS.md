# Founders — DJ & CJ

RaftOff’s first two people on the water are **DJ** (`@dj`) and **CJ** (`@cj`).

| Handle | Display | Role on About page | Badges |
|--------|---------|--------------------|--------|
| `dj` | DJ | Co-founder · first user | `founding-member`, `founder` |
| `cj` | CJ | Co-founder · CEO | `founding-member`, `founder` |

Story copy lives on the marketing site: [`web/about.html`](../web/about.html) → https://raftoffsocial.com/about.html

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

3. Immediately set usernames to `dj` / `cj` in SQL (or in-app profile edit), then apply founder polish:

```bash
supabase db push
# or re-run the UPDATE statements in:
# supabase/migrations/20260807235000_founder_profiles.sql
```

Optional one-shot after both accounts exist (SQL editor):

```sql
-- Claim short usernames if still free, then badge
update public.profiles
set username = 'dj', display_name = 'DJ', is_verified = true,
    badges = array['founding-member', 'founder']
where id = '<DJ_AUTH_USER_UUID>';

update public.profiles
set username = 'cj', display_name = 'CJ', is_verified = true,
    badges = array['founding-member', 'founder']
where id = '<CJ_AUTH_USER_UUID>';
```

## Badge notes

- `founding-member` — early launch badge (also awarded broadly during initial launch migrations).
- `founder` — reserved for DJ and CJ (shown in product wherever badges are rendered).

## Checklist

- [ ] Create DJ auth user; username `dj`
- [ ] Create CJ auth user; username `cj`
- [ ] Confirm `founder` + `founding-member` badges and `is_verified`
- [ ] About page live: `/about.html`
