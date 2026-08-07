# Seed data (deprecated for client runtime)

Geographic reference data for production lives in SQL migrations:

- `supabase/migrations/20260806101000_production_geo_seed.sql`

**Founders (DJ & CJ):** profiles require real `auth.users` rows. See [`docs/FOUNDERS.md`](../../docs/FOUNDERS.md) and migration `20260807235000_founder_profiles.sql` — create the accounts in Supabase Auth, claim usernames `dj` / `cj`, then apply the founder badge update.

TypeScript files in this folder are retained for offline validation tooling only.
Do **not** import demo boat counts, fake check-ins, or AsyncStorage seeds into the app.
