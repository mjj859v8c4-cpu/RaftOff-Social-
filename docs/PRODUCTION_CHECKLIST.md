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

- [ ] Supabase project provisioned; migrations applied
- [ ] Auth providers enabled (Email, Google, Apple) in Supabase dashboard
- [ ] Storage buckets created + policies applied
- [ ] Edge functions deployed with secrets
- [ ] `expire-check-ins` scheduled (cron)
- [ ] Mapbox token URL-restricted
- [ ] Sentry DSN configured
- [ ] Netlify env vars set (no service-role on client)
- [ ] Privacy / Terms / Guidelines linked in app + marketing site
- [ ] Smoke test: signup → verify → drop anchor → like → comment → report
