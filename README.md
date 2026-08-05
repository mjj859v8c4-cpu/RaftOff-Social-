# RaftOff Social

**Find your crew. Find your spot.**

Location-aware social app for Michigan lakes — bird’s-eye aerial maps, Drop Anchor check-ins, live feeds, events, and waterfront bars & restaurants.

## What’s included

- **Expo app** (Map · Feed · Drop Anchor · Events · Profile)
- **12 popular Michigan lakes** with lake switcher
- **Bird’s-eye aerial imagery** (Esri World Imagery; Mapbox satellite if token set)
- **Bars & restaurants** strip + dining map filter
- **Lake St. Clair launch registry** + expanded places (coordinates reviewed as `needs_review`)
- **Supabase migrations**, Edge Functions stubs, seed data
- **Static marketing site** in `web/` (Netlify-ready)

## Run the app

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # if using portable Node
cd ~/Projects/raftoff-social
cp -n .env.example .env.local
npm install
npx expo start
```

Optional in `.env.local`:

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` (`pk.…`) — upgrades aerial to Mapbox satellite-streets

Without keys, the app runs in **local demo mode** with aerial tiles + seeded activity.

## Deploy marketing site

Deploy the `web/` folder to Netlify (or similar), then point your GoDaddy domain at it.

## Safety

RaftOff is **not** a navigation product. No public exact fishing GPS. Dining pins are approximate waterfront businesses pending verification.

## Docs

- Product PRD / deployment PDF in repo root
- Core loop: Map → pin → location feed → Drop Anchor → realtime update
