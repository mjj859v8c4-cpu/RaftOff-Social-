# RaftOff Social — Production

Expo + Supabase location social app for Michigan lakes (Lake St. Clair first).

## Quick start

1. Copy `.env.example` → `.env.local` and fill Supabase + Mapbox public keys
2. Apply migrations: `supabase db push` (or SQL editor)
3. Enable Auth providers (Email, Google, Apple) in Supabase
4. Deploy Edge Functions: `expire-check-ins`, `location-feed`, `waitlist`
5. `npm install && npx expo start`

## Production checklist

See [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) and [`docs/MONITORING.md`](docs/MONITORING.md).

## Deploy

- **Marketing site:** Netlify publish `web/` (see `web/netlify.toml`)
- **Mobile:** EAS Build with `EXPO_PUBLIC_*` secrets
- **Never** put `SUPABASE_SERVICE_ROLE_KEY` in client env

## Architecture

- Auth, profiles, boats, check-ins, posts, comments, likes, follows, notifications, reports, blocks → Supabase
- Storage buckets: profile / boat / check-in / event photos
- RLS on all tables; rate limits via `check_rate_limit`
- Map: Mapbox satellite when token present, else Esri aerial + marker clustering
