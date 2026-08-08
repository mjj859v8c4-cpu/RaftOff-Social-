# RaftOff Social System

Quick map of social screens, API layer, and Postgres tables for Dale.

## Screens → routes

| Screen | Route | Primary API / feature module |
|--------|-------|------------------------------|
| Login | `app/(auth)/login.tsx` | `features/auth/api.ts` |
| Onboarding (name + handle) | `app/(auth)/onboarding.tsx` | `updateMyProfile` → `profiles` |
| Map | `app/(tabs)/map.tsx` | `features/map/store.ts`, check-in FAB → drop-anchor |
| Feed | `app/(tabs)/feed.tsx` | `features/feed/api.ts`, `features/posts/api.ts` |
| Messages inbox | `app/(tabs)/messages.tsx` | `listConversations` |
| Message thread | `app/messages/[id].tsx` | `listMessages`, `sendMessage` |
| Discover | `app/(tabs)/discover.tsx` | `features/social/discover.ts` RPCs |
| Connections + requests | `app/connections/index.tsx` | `listConnectionProfiles`, `connection_requests` |
| Own profile | `app/(tabs)/profile.tsx` | `features/profiles/api.ts` |
| Edit profile | `app/profile/edit.tsx` | `updateMyProfile`, boats, interests, photos |
| Public profile | `app/u/[username].tsx` | connect / follow / message / report-block |
| Check-in (Drop Anchor) | `app/(tabs)/drop-anchor.tsx` | `features/map/store.dropAnchor` → `check_ins` |
| Notifications | `app/notifications/index.tsx` | `features/notifications/api.ts` |
| Location detail | `app/locations/[locationId].tsx` | location feed, check-in entry |

**Tab bar:** Map · Feed · Messages · Discover · Profile. Drop Anchor and Events are hidden tabs (`href: null`).

## Social graph (conceptual)

```
Follow (one-way)     follows.follower_id → follows.following_id
Connect (mutual)     connection_requests → accept → connections (profile_a, profile_b)
Message (DM)         get_or_create_dm → conversations + conversation_members + messages
Check-in             check_ins (temporary presence, audience + precision controls)
```

- **Follow** = lightweight interest; shows in follower counts, can gate DMs via `message_privacy`.
- **Connect** = mutual link; required for DMs when `message_privacy = 'connections'`.
- **Block** = `blocks` table; hides pair in discovery, DMs, and connect flows.

## Postgres tables (social-relevant)

| Table | Purpose |
|-------|---------|
| `profiles` | Identity, privacy flags (`profile_visibility`, `message_privacy`, `show_on_water`, …), `onboarding_completed` |
| `boats` | Watercraft; `is_primary` for profile card |
| `interests` | Catalog of interest tags |
| `profile_interests` | M:N profile ↔ interest |
| `profile_photos` | Gallery images |
| `identity_tag_catalog` | Reference list; values stored on `profiles.identity_tags[]` |
| `follows` | One-way follow edges |
| `connection_requests` | Pending / declined / cancelled connect requests |
| `connections` | Accepted mutual connections (unordered pair) |
| `conversations` | DM thread metadata (`updated_at`) |
| `conversation_members` | Who is in each thread + `last_read_at` |
| `messages` | DM bodies |
| `user_statuses` | Short-lived “what’s up” status lines |
| `notifications` | In-app alerts (connect, follow, likes, …) |
| `blocks` | User blocks (both directions enforced in RPCs) |
| `reports` | Moderation reports |
| `check_ins` | Temporary on-water presence |
| `posts` | Feed posts (including check-in posts) |
| `lake_members` | Optional lake-scoped membership |
| `crews` / `crew_members` | Group audience for check-ins (future / partial) |
| `analytics_events` | First-party product analytics queue target |

Key RPCs: `follow_profile`, `unfollow_profile`, `accept_connection_request`, `get_or_create_dm`, `suggested_connections`, `mutual_connection_count`, `end_check_in`.

## Client modules

| Path | Role |
|------|------|
| `features/profiles/api.ts` | Profiles, boats, interests, connect/follow/DM, photos, completion |
| `features/social/discover.ts` | Discovery + search RPC wrappers |
| `features/messages/unread.ts` | Unread badge for tab bar |
| `features/messages/errors.ts` | DM privacy / block error copy |
| `features/moderation/api.ts` | Report + block + analytics |
| `features/check-ins/api.ts` | Remote check-in helper |
| `lib/analytics/index.ts` | Event union + local queue |
| `components/social/ConnectButton.tsx` | Reusable connect CTA |
| `components/safety/SafetyBanner.tsx` | Check-in / DM / profile safety copy |

## Analytics events (social funnel)

| Event | Fired when |
|-------|------------|
| `connect_user` | Connect request sent or accepted |
| `follow_user` | Follow via `followProfile` |
| `send_message` | DM sent |
| `check_in` | Check-in created (alongside legacy `drop_anchor`) |
| `profile_complete` | `onboarding_completed: true` saved on profile |

## Safety UX

Short banners on check-in, message thread, and public profile (`SafetyBanner`): voluntary location, meet carefully, report/block available via `ReportBlockModal` (••• on profiles).
