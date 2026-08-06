# Production monitoring

## Runtime
- **Sentry** (`EXPO_PUBLIC_SENTRY_DSN`) — crashes + error breadcrumbs via `lib/crashReporting.ts`
- **Logger** (`lib/logging.ts`) — structured console in dev; forwards errors to Sentry in prod
- **Analytics** (`lib/analytics`) — product events flush to `analytics_events`

## Backend
- Supabase dashboard: Auth, DB, Storage, Edge Function logs
- Schedule `expire-check-ins` every 5 minutes (Supabase cron / GitHub Action)
- Watch `rate_limits` growth and open `reports` queue

## Netlify
- Deploy notifications on failed builds
- Form / waitlist function error rate via Edge logs
- Uptime: ping `https://raftoff.social/` and Supabase health

## Alerts to configure
1. Sentry spike > 20 events / 5 min
2. Edge function 5xx rate
3. Auth failure spike
4. Storage upload failures
5. Open reports > 25
