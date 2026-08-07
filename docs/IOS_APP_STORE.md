# RaftOff Social — iOS App Store readiness

Use this checklist to ship `com.raftoff.social` to TestFlight and the App Store via EAS.

## What’s already configured in the repo

- [x] Bundle ID: `com.raftoff.social`
- [x] Display name: **RaftOff**
- [x] Portrait, dark UI, 1024×1024 icon / splash assets
- [x] Apple Sign In plugin (`expo-apple-authentication` + `usesAppleSignIn`)
- [x] Location **when-in-use only** (no background tracking)
- [x] Camera + photo library usage strings
- [x] Export compliance: non-exempt encryption **false** (`ITSAppUsesNonExemptEncryption`)
- [x] Privacy Manifest (`ios.privacyManifests`) for common required-reason APIs
- [x] EAS profiles: `development` / `preview` / `production` + submit stub (`eas.json`)
- [x] Legal URLs on site: `/privacy`, `/terms`, `/guidelines`

## One-time Apple + Expo setup (you)

1. **Apple Developer Program** ($99/yr) — https://developer.apple.com  
2. **App Store Connect** → create app  
   - Name: RaftOff Social  
   - Bundle ID: `com.raftoff.social`  
   - SKU: `raftoff-social-ios`  
3. **Expo account + EAS project**
   ```bash
   npx eas-cli login
   npx eas-cli init
   ```
   This writes a real `extra.eas.projectId` into `app.json`.  
4. Paste into `eas.json` → `submit.production.ios`:
   - `appleTeamId` (Membership details in Apple Developer)
   - `ascAppId` (App Store Connect → App Information → Apple ID)

## Secrets for production builds

In [Expo dashboard → Project → Secrets](https://expo.dev) (or `eas secret:create`), set:

| Secret | Notes |
|--------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://nvqbwacnvlpcllbitugx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key only |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Public `pk.` token; restrict by bundle ID in Mapbox |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional |
| `EXPO_PUBLIC_SITE_URL` | `https://raftoffsocial.com` |

Never put `SUPABASE_SERVICE_ROLE_KEY` in EAS public env.

## Build & TestFlight

```bash
# Internal / device install (Ad Hoc / internal distribution)
npm run build:ios:preview

# App Store / TestFlight binary
npm run build:ios:production

# Upload to App Store Connect (after build finishes)
npm run submit:ios
```

Or combined:

```bash
npx eas-cli build --platform ios --profile production --auto-submit
```

## App Store Connect listing (required for review)

| Field | Suggested value |
|-------|-----------------|
| Subtitle | Find your crew on the lake |
| Category | Social Networking (secondary: Lifestyle) |
| Age rating | 17+ if user-generated content / social; answer questionnaire honestly |
| Privacy Policy URL | `https://raftoffsocial.com/privacy` |
| Support URL | `https://raftoffsocial.com` |
| Marketing URL | `https://raftoffsocial.com` |
| Review notes | Demo lake: Lake St. Clair. Sign in with email or Apple. Location is optional (when-in-use) for Drop Anchor. |

### Screenshots

Need iPhone 6.7" (and ideally 6.5" / iPad if tablet claimed). Capture:

1. Live map with pins  
2. Bars & food / partner strip  
3. Drop Anchor flow  
4. Lake feed  
5. Profile / privacy defaults  

### App Privacy (nutrition label)

Declare at least:

- **Location** — Precise / Coarse — App Functionality — linked to user — only when Drop Anchor / permission granted  
- **Contact Info** — Email — Account  
- **User Content** — Photos, other user content — App Functionality  
- **Identifiers** — User ID — App Functionality  
- **Diagnostics** — Crash data (if Sentry enabled)  
- **Tracking**: No (unless you later add ATT advertising SDKs)

## Supabase / Sign in with Apple

1. Apple Developer → Identifiers → App ID `com.raftoff.social` → enable **Sign In with Apple**  
2. Create Services ID / key if using web OAuth; native Expo uses the app ID  
3. Supabase → Authentication → Providers → **Apple** → enable and paste key / team / client IDs  
4. Auth → URL config: add `raftoff://` and `https://raftoffsocial.com` redirect allow-list  

## Mapbox (iOS)

In Mapbox account → token → URL / bundle restrictions, allow:

- `com.raftoff.social`

## Review gotchas we already avoided

- No background location entitlement  
- Encryption export answered  
- Privacy usage strings present  
- Privacy Manifest present (update if Apple emails missing reasons after first submit)  
- Legal pages live on the marketing domain  

## After first successful TestFlight

- [ ] Internal testers (CJ + crew)  
- [ ] External TestFlight if needed (Beta App Review)  
- [ ] Submit for App Review  
- [ ] Enable App Store phased release  

## Commands cheat sheet

```bash
npx eas-cli whoami
npx eas-cli build:list --platform ios
npx eas-cli submit --platform ios --latest
npx eas-cli credentials    # manage certs / profiles if needed
```
