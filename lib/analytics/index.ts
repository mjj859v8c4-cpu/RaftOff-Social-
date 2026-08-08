/**
 * RaftOff commercial analytics layer
 * ----------------------------------
 * Captures first-party product metadata for:
 *  - growth (funnels, retention)
 *  - monetization (sponsor packages, marina ads, brand deals)
 *
 * HARD RULES (aligned with product privacy PDF):
 *  - Never store private GPS / fishing hole coordinates here
 *  - Prefer place slug + type + hour bucket over exact identity
 *  - User ids are hashed before commercial sync
 *  - Users can disable commercial_ok via privacy settings
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "raftoff-analytics-queue-v1";
const CONSENT_KEY = "raftoff-analytics-consent-v1";
const ANON_KEY = "raftoff-anon-id-v1";
const PROFILE_KEY = "raftoff-audience-profile-v1";
const MAX_QUEUE = 500;

export type AnalyticsEventName =
  | "app_open"
  | "session_heartbeat"
  | "map_view"
  | "map_filter"
  | "lake_switch"
  | "pin_tap"
  | "sheet_view"
  | "sheet_cta"
  | "drop_anchor"
  | "drop_anchor_start"
  | "drop_anchor_submit"
  | "check_in_end"
  | "check_in_extend"
  | "feed_view"
  | "feed_tab"
  | "post_like"
  | "like_post"
  | "unlike_post"
  | "comment_post"
  | "create_post"
  | "save_post"
  | "event_view"
  | "create_event"
  | "rsvp_event"
  | "event_rsvp"
  | "event_create"
  | "auth_sign_up"
  | "auth_sign_in"
  | "auth_sign_out"
  | "auth_password_reset"
  | "block_user"
  | "report_content"
  | "follow_user"
  | "connect_user"
  | "send_message"
  | "check_in"
  | "profile_complete"
  | "upload_photo"
  | "profile_view"
  | "share_intent"
  | "status_set"
  | "status_clear"
  | "create_crew"
  | "join_crew"
  | "leave_crew"
  | "web_cta"
  | "audience_profile_update";

export type AudienceProfile = {
  /** ICP signal — boat owner vs guest */
  hasBoat?: boolean;
  boatLengthFtBucket?: "under_20" | "20_30" | "30_40" | "40_plus" | null;
  ageBucket?: "18_24" | "25_34" | "35_44" | "45_plus" | null;
  genderPresentation?: "female" | "male" | "nonbinary" | "unspecified" | null;
  interests?: string[];
  homeLakeSlug?: string;
  /** Opt-in to include hashed profile in commercial aggregates */
  commercialOk: boolean;
};

export type AnalyticsProps = {
  lake_id?: string;
  location_id?: string;
  location_slug?: string;
  location_type?: string;
  vibe?: string;
  audience?: string;
  /** Never "exact gps" — only product precision enum */
  precision?: string;
  duration_minutes?: number;
  filter?: string;
  tab?: string;
  cta?: string;
  event_id?: string;
  post_id?: string;
  source?: string;
  [key: string]: unknown;
};

export type QueuedEvent = {
  id: string;
  name: AnalyticsEventName;
  ts: string;
  session_id: string;
  anon_id: string;
  platform: "ios" | "android" | "web" | "unknown";
  hour_bucket: number;
  dow: number;
  props: AnalyticsProps;
  commercial_ok: boolean;
};

type ConsentState = {
  productAnalytics: boolean;
  commercialInsights: boolean;
  updatedAt: string;
};

let memoryQueue: QueuedEvent[] = [];
let sessionId = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
let anonIdCache: string | null = null;
let consentCache: ConsentState | null = null;
let profileCache: AudienceProfile | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function platform(): QueuedEvent["platform"] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native");
    if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
      return Platform.OS;
    }
  } catch {
    /* web static */
  }
  if (typeof window !== "undefined") return "web";
  return "unknown";
}

function hourBucket(d = new Date()) {
  return d.getHours();
}

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

async function getAnonId(): Promise<string> {
  if (anonIdCache) return anonIdCache;
  try {
    const existing = await AsyncStorage.getItem(ANON_KEY);
    if (existing) {
      anonIdCache = existing;
      return existing;
    }
    const id = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(ANON_KEY, id);
    anonIdCache = id;
    return id;
  } catch {
    anonIdCache = `anon_mem_${Math.random().toString(36).slice(2)}`;
    return anonIdCache;
  }
}

export async function getConsent(): Promise<ConsentState> {
  if (consentCache) return consentCache;
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (raw) {
      consentCache = JSON.parse(raw) as ConsentState;
      return consentCache;
    }
  } catch {
    /* default */
  }
  consentCache = {
    productAnalytics: true,
    commercialInsights: true,
    updatedAt: new Date().toISOString(),
  };
  return consentCache;
}

export async function setConsent(next: Partial<ConsentState>) {
  const current = await getConsent();
  consentCache = {
    ...current,
    ...next,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consentCache));
  track("audience_profile_update", { source: "consent" });
}

export async function getAudienceProfile(): Promise<AudienceProfile> {
  if (profileCache) return profileCache;
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) {
      profileCache = JSON.parse(raw) as AudienceProfile;
      return profileCache;
    }
  } catch {
    /* default */
  }
  profileCache = { commercialOk: true, interests: [] };
  return profileCache;
}

export async function updateAudienceProfile(patch: Partial<AudienceProfile>) {
  const current = await getAudienceProfile();
  profileCache = { ...current, ...patch };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileCache));
  track("audience_profile_update", {
    has_boat: profileCache.hasBoat ?? null,
    age_bucket: profileCache.ageBucket ?? null,
    gender: profileCache.genderPresentation ?? null,
    boat_bucket: profileCache.boatLengthFtBucket ?? null,
  });
}

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = { ...props };
  // Strip anything that smells like exact coordinates
  delete out.latitude;
  delete out.longitude;
  delete out.lat;
  delete out.lng;
  delete out.private_position;
  delete out.exact_gps;
  delete out.fishing_hole;
  return out;
}

async function persistQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(memoryQueue.slice(-MAX_QUEUE)));
  } catch {
    /* ignore */
  }
}

async function loadQueue() {
  if (memoryQueue.length) return;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) memoryQueue = JSON.parse(raw) as QueuedEvent[];
  } catch {
    memoryQueue = [];
  }
}

/**
 * Core track — fire-and-forget. Safe to call from UI.
 */
export function track(name: AnalyticsEventName, props?: AnalyticsProps) {
  void enqueue(name, props);
}

async function enqueue(name: AnalyticsEventName, props?: AnalyticsProps) {
  const consent = await getConsent();
  if (!consent.productAnalytics) return;

  await loadQueue();
  const anon = await getAnonId();
  const profile = await getAudienceProfile();
  const now = new Date();
  const commercial_ok = consent.commercialInsights && profile.commercialOk !== false;

  const event: QueuedEvent = {
    id: `ev_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    ts: now.toISOString(),
    session_id: sessionId,
    anon_id: anon,
    platform: platform(),
    hour_bucket: hourBucket(now),
    dow: now.getDay(),
    props: sanitizeProps(props),
    commercial_ok,
  };

  // Attach sellable audience signals only when commercial_ok
  if (commercial_ok) {
    event.props.audience_has_boat = profile.hasBoat ?? null;
    event.props.audience_age_bucket = profile.ageBucket ?? null;
    event.props.audience_gender = profile.genderPresentation ?? null;
    event.props.audience_boat_bucket = profile.boatLengthFtBucket ?? null;
    event.props.audience_hash = simpleHash(anon);
  }

  memoryQueue.push(event);
  if (memoryQueue.length > MAX_QUEUE) {
    memoryQueue = memoryQueue.slice(-MAX_QUEUE);
  }
  await persistQueue();

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, event.props);
  }

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, 4000);
  }
}

/**
 * Flush queue to backend when configured.
 * Until Supabase is wired, events remain local for demo export.
 */
export async function flush() {
  await loadQueue();
  if (!memoryQueue.length) return { sent: 0, remaining: 0 };

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || url.includes("YOUR_PROJECT") || !key || key.includes("your_anon")) {
    return { sent: 0, remaining: memoryQueue.length };
  }

  const batch = memoryQueue.slice(0, 100);
  try {
    const res = await fetch(`${url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(
        batch.map((e) => ({
          event_id: e.id,
          name: e.name,
          ts: e.ts,
          session_id: e.session_id,
          anon_id: e.anon_id,
          platform: e.platform,
          hour_bucket: e.hour_bucket,
          dow: e.dow,
          commercial_ok: e.commercial_ok,
          props: e.props,
        }))
      ),
    });
    if (res.ok || res.status === 201) {
      memoryQueue = memoryQueue.slice(batch.length);
      await persistQueue();
      return { sent: batch.length, remaining: memoryQueue.length };
    }
  } catch {
    /* keep queue */
  }
  return { sent: 0, remaining: memoryQueue.length };
}

/** Build sellable insight packages from local queue (demo / staging). */
export async function buildCommercialInsights() {
  await loadQueue();
  const commercial = memoryQueue.filter((e) => e.commercial_ok);

  const locationHeat: Record<string, number> = {};
  const vibeMix: Record<string, number> = {};
  const hourHeat: Record<number, number> = {};
  const boatOwnerTouches = { boat: 0, guest: 0, unknown: 0 };
  const genderMix: Record<string, number> = {};
  const funnel = {
    map_view: 0,
    pin_tap: 0,
    sheet_view: 0,
    drop_anchor_submit: 0,
    event_rsvp: 0,
  };

  for (const e of commercial) {
    if (e.props.location_slug) {
      locationHeat[e.props.location_slug] = (locationHeat[e.props.location_slug] ?? 0) + 1;
    }
    if (typeof e.props.vibe === "string") {
      vibeMix[e.props.vibe] = (vibeMix[e.props.vibe] ?? 0) + 1;
    }
    hourHeat[e.hour_bucket] = (hourHeat[e.hour_bucket] ?? 0) + 1;

    if (e.props.audience_has_boat === true) boatOwnerTouches.boat += 1;
    else if (e.props.audience_has_boat === false) boatOwnerTouches.guest += 1;
    else boatOwnerTouches.unknown += 1;

    const g = e.props.audience_gender;
    if (typeof g === "string") genderMix[g] = (genderMix[g] ?? 0) + 1;

    if (e.name in funnel) {
      funnel[e.name as keyof typeof funnel] += 1;
    }
  }

  const topLocations = Object.entries(locationHeat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, score]) => ({ slug, score }));

  return {
    generated_at: new Date().toISOString(),
    event_count: commercial.length,
    product: "raftoff_lake_insights_v1",
    packages: {
      /** Sell to marinas / sponsors: where attention clusters (place-level) */
      location_heat: topLocations,
      /** Sell to alcohol / lifestyle brands: vibe demand */
      vibe_mix: vibeMix,
      /** Daypart for ads */
      hour_heat: hourHeat,
      /** ICP mix — boat owners vs guests */
      boat_owner_ratio: boatOwnerTouches,
      /** Audience composition (opt-in profile fields only) */
      gender_mix: genderMix,
      /** Conversion funnel for growth + pricing decks */
      funnel,
    },
    notes: [
      "Place-level only — no private GPS or fishing coordinates.",
      "Intended for aggregated sponsor / marina / brand packages.",
    ],
  };
}

export async function exportCommercialInsightsJson(): Promise<string> {
  const insights = await buildCommercialInsights();
  return JSON.stringify(insights, null, 2);
}

export function newSession() {
  sessionId = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  track("app_open", { source: "session_start" });
}

export async function getQueueSize() {
  await loadQueue();
  return memoryQueue.length;
}
