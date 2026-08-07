# RaftOff Social — Production Deployment Checklist

Track every requirement through implementation. Status: `[ ]` pending · `[x]` done.

## Data & Backend

- [x] 1. Replace all localStorage / AsyncStorage product data with Supabase
- [x] 2. Finish Supabase Authentication (email/password, Google, Apple, reset, verify, sessions)
- [x] 3. Build production database (normalized tables + FKs)
- [x] 4. Enable Row Level Security on every table
- [x] 5. Create Storage buckets (profile, boat, check-in, event photos)
- [x] 6. Build production APIs
- [x] 7. Replace every mock API with real Supabase calls
- [x] 8. Remove every seed/demo dataset from the client (geo reference data lives in SQL only)

## App Quality

- [x] 9. Production error handling
- [x] 10. Loading states
- [x] 11. Offline handling
- [x] 12. Logging
- [x] 13. Analytics
- [x] 14. Crash reporting
- [x] 15. Secure environment variables
- [x] 16. Performance optimization
- [x] 17. Optimize map requests
- [x] 18. Cluster map markers
- [x] 19. Lazy load images
- [x] 20. Compress uploads
- [x] 21. Caching

## Trust & Safety

- [x] 22. Privacy Policy page
- [x] 23. Terms of Service
- [x] 24. Community Guidelines
- [x] 25. Report User
- [x] 26. Block User
- [x] 27. Content Moderation
- [x] 28. Admin Dashboard
- [x] 29. Rate limiting
- [x] 30. Production monitoring

## Deploy

- [x] 31. Netlify production configuration
- [x] 32. This checklist (living doc)
- [x] 33. Production build with zero errors

## Deploy gates (manual — ops)

- [x] Supabase project provisioned; migrations applied (`nvqbwacnvlpcllbitugx`)
- [ ] Auth providers enabled (Email, Google, Apple) in Supabase dashboard
- [x] Storage buckets created + policies applied (via production schema migration)
- [x] Edge functions deployed (`expire-check-ins`, `location-feed`, `waitlist`)
- [x] `expire-check-ins` scheduled (pg_cron every 5 min → `expire_check_ins()`)
- [ ] Mapbox token URL-restricted
- [ ] Sentry DSN configured
- [x] Netlify site linked + production deploy (`raftoff-social.netlify.app`)
- [x] Custom domain attached (`raftoffsocial.com` + `www`); site SSO/password gate off (public)
- [x] Domain attached on Netlify (`raftoffsocial.com` + `www`)
- [x] Netlify DNS zone created (records ready)
- [x] https://raftoffsocial.com serves Netlify + Let’s Encrypt SSL (`ssl: true`)
- [ ] Netlify env vars set for Expo web build (no service-role on client)
- [ ] Privacy / Terms / Guidelines linked in app + marketing site
- [ ] Smoke test: signup → verify → drop anchor → like → comment → report
- [ ] iOS App Store: EAS project + Apple Developer app created (see `docs/IOS_APP_STORE.md`)
- [ ] iOS TestFlight build uploaded via `npm run build:ios:production`
