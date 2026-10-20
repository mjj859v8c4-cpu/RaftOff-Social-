# Rochester Mobile Auto Repair

Production-ready marketing website for **Rochester Mobile Auto Repair** — a mobile mechanic serving Rochester, Rochester Hills, and surrounding Oakland & Macomb County communities in Michigan.

**Tagline:** Quality Repairs. At Your Location.  
**Phone:** [(248) 928-4118](tel:+12489284118)

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn-style UI primitives (Radix + CVA)
- Lucide React icons
- Framer Motion
- React Hook Form + Zod
- Resend for transactional email delivery

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

## Environment variables

Configure these in `.env.local` (local) and in the Vercel project settings (production):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL for SEO / sitemap / OG |
| `RESEND_API_KEY` | Yes (production) | Server-side Resend API key |
| `EMAIL_FROM` | Yes (production) | Verified sender address |
| `BOOKING_INBOX_EMAIL` | Yes (production) | Inbox for appointment requests |
| `CONTACT_INBOX_EMAIL` | Optional | Inbox for contact form (falls back to booking inbox) |
| `ALLOW_DEV_EMAIL_FALLBACK` | No | If `true`, logs emails instead of sending (dev only) |

Outside Vercel production, if Resend is not configured, form submissions are validated and logged to the server console so you can test the full UX safely. On Vercel production, `RESEND_API_KEY` and `BOOKING_INBOX_EMAIL` are required (unless `ALLOW_DEV_EMAIL_FALLBACK=true`).

**Never** put API keys in client components or `NEXT_PUBLIC_*` variables.

## Pages

- `/` — Homepage (hero, trust highlights, services, how it works, why us, service area, CTA)
- `/services` — Detailed service sections
- `/book` — Validated appointment request form
- `/about` — Company introduction + editable placeholders for history/bios/credentials
- `/service-areas` — Local SEO landing sections for six communities
- `/contact` — Click-to-call, hours placeholders, contact form

## Forms & API

- `POST /api/book` — appointment requests
- `POST /api/contact` — general contact messages

Both endpoints include:

- Zod server-side validation
- Honeypot spam field
- Per-IP rate limiting (in-memory; swap for Redis/Upstash in multi-instance production)
- Email delivery via Resend
- Success confirmation only after the server accepts the submission

Appointment copy clearly states requests are **not confirmed** until the business contacts the customer.

## Business details to update before launch

1. Confirm phone number, email, and preferred inbox.
2. Replace placeholder business hours on the Contact page (`src/lib/constants.ts`).
3. Fill editable About placeholders with verified history, bios, and qualifications only.
4. Replace Unsplash temporary photography with owned/licensed brand photos when available.
5. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
6. Verify a sending domain in Resend and set `EMAIL_FROM`.
7. Optional: upgrade rate limiting to Redis/Upstash for multi-region serverless.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example`.
4. Deploy. Vercel detects Next.js automatically.
5. Attach your custom domain and update `NEXT_PUBLIC_SITE_URL`.
6. Submit the sitemap (`/sitemap.xml`) in Google Search Console.

CLI alternative:

```bash
npm i -g vercel
vercel
vercel env add RESEND_API_KEY
vercel env add BOOKING_INBOX_EMAIL
vercel env add EMAIL_FROM
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod
```

## Project structure

```text
src/
  app/                 # App Router pages, API routes, SEO files
  components/
    brand/             # Logo / wordmark
    forms/             # Booking + contact forms
    layout/            # Navbar, footer, mobile bars
    motion/            # Reduced-motion-aware animations
    sections/          # Reusable page sections
    seo/               # JSON-LD
    ui/                # Button, input, select, etc.
  data/                # Services + service areas content
  lib/                 # Utils, validation, email, rate limit
public/                # Logo + Open Graph assets
```

## Accessibility & quality notes

- Keyboard-accessible navigation and forms
- Visible focus styles with neon accent
- `prefers-reduced-motion` respected for animations
- Semantic landmarks, descriptive alt text, and LocalBusiness/AutoRepair structured data
- No fabricated reviews, ratings, warranties, prices, or certifications

## License / imagery note

Unsplash photographs are used as temporary licensed placeholders. Replace with owned brand photography before long-term commercial use if required by your brand guidelines.
