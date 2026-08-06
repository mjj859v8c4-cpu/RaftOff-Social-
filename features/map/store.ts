import { create } from "zustand";
import type { CheckIn, Lake, LakeEvent, LakeSummary, Location, Post } from "@/types/raftoff";
import type { DropAnchorInput } from "@/lib/validation";
import * as api from "@/lib/api/production";
import { logger } from "@/lib/logging";
import { getNetworkStatus, assertOnline } from "@/lib/network";
import { useAuthStore } from "@/features/auth/store";

function assertOnlineSafe() {
  assertOnline();
}

type LoadState = "idle" | "loading" | "ready" | "error";

type RaftOffState = {
  status: LoadState;
  error: string | null;
  offline: boolean;
  lakes: Lake[];
  activeLakeId: string | null;
  selectedLocationId: string | null;
  locations: Location[];
  checkIns: CheckIn[];
  posts: Post[];
  events: LakeEvent[];
  summary: LakeSummary | null;
  cacheUpdatedAt: number | null;

  setActiveLake: (lakeId: string) => Promise<void>;
  setActiveLakeId: (lakeId: string) => void;
  selectLocation: (locationId: string | null) => void;
  hydrate: () => Promise<void>;
  refreshLake: (lakeId?: string) => Promise<void>;
  dropAnchor: (input: DropAnchorInput & { photoUrl?: string | null }) => Promise<void>;
  endCheckIn: (checkInId: string) => Promise<void>;
  extendCheckIn: (checkInId: string, extraMinutes: number) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  createEvent: (input: {
    title: string;
    locationId?: string;
    category: string;
    startsAt: string;
    description?: string;
    coverPhotoUrl?: string;
  }) => Promise<void>;
  rsvpEvent: (eventId: string, going: boolean) => Promise<void>;
  locationsForActiveLake: () => Location[];
  diningForActiveLake: () => Location[];
  getSummary: () => LakeSummary;
  getLocationFeed: (locationId: string) => {
    location: Location | undefined;
    checkIns: CheckIn[];
    posts: Post[];
    live: CheckIn[];
    recent: Post[];
    fishing: Post[];
    events: LakeEvent[];
    info: Location | undefined;
  };
  activeMineId: string | null;
};

const memoryCache = new Map<string, { at: number; locations: Location[]; posts: Post[]; events: LakeEvent[]; checkIns: CheckIn[]; summary: LakeSummary }>();
const CACHE_TTL_MS = 60_000;

export const useRaftOffStore = create<RaftOffState>((set, get) => ({
  status: "idle",
  error: null,
  offline: false,
  lakes: [],
  activeLakeId: null,
  selectedLocationId: null,
  locations: [],
  checkIns: [],
  posts: [],
  events: [],
  summary: null,
  cacheUpdatedAt: null,
  activeMineId: null,

  setActiveLakeId: (lakeId) => {
    void get().setActiveLake(lakeId);
  },

  selectLocation: (locationId) => set({ selectedLocationId: locationId }),

  locationsForActiveLake: () => {
    const { locations, activeLakeId } = get();
    if (!activeLakeId) return locations;
    return locations.filter((l) => l.lake_id === activeLakeId);
  },

  diningForActiveLake: () =>
    get()
      .locationsForActiveLake()
      .filter((l) =>
        ["restaurant", "fuel", "bait", "marine_service"].includes(l.type)
      ),

  getSummary: () =>
    get().summary ?? {
      lake_name: "Lake",
      active_check_ins: 0,
      active_boats: null,
      active_hotspots: 0,
      top_spot: null,
      updated_at: new Date().toISOString(),
    },

  getLocationFeed: (locationId: string) => {
    const { checkIns, posts, events, locations } = get();
    const info = locations.find((l) => l.id === locationId || l.slug === locationId);
    const id = info?.id ?? locationId;
    const live = checkIns.filter((c) => c.location_id === id && c.status === "active");
    const recent = posts.filter((p) => p.location_id === id);
    const fishing = posts.filter(
      (p) =>
        p.location_id === id &&
        (p.post_type === "fishing" || (p.text ?? "").toLowerCase().includes("fish"))
    );
    return {
      location: info,
      checkIns: live.concat(
        checkIns.filter((c) => c.location_id === id && c.status !== "active")
      ),
      posts: recent,
      live,
      recent,
      fishing,
      events: events.filter((e) => e.location_id === id),
      info,
    };
  },

  setActiveLake: async (lakeId) => {
    set({ activeLakeId: lakeId });
    await get().refreshLake(lakeId);
  },

  hydrate: async () => {
    set({ status: "loading", error: null, offline: !getNetworkStatus().isConnected });
    try {
      const lakes = await api.listLakes();
      const preferred =
        lakes.find((l) => l.slug === "lake-st-clair")?.id ?? lakes[0]?.id ?? null;
      set({ lakes, activeLakeId: preferred, status: preferred ? "loading" : "ready" });
      if (preferred) await get().refreshLake(preferred);
      else set({ status: "ready" });
    } catch (e) {
      logger.error("store.hydrate", e);
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Failed to load",
        offline: !getNetworkStatus().isConnected,
      });
    }
  },

  refreshLake: async (lakeId) => {
    const id = lakeId ?? get().activeLakeId;
    if (!id) return;

    const cached = memoryCache.get(id);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      set({
        locations: cached.locations,
        posts: cached.posts,
        events: cached.events,
        checkIns: cached.checkIns,
        summary: cached.summary,
        cacheUpdatedAt: cached.at,
        status: "ready",
        offline: !getNetworkStatus().isConnected,
      });
      return;
    }

    set({ status: "loading", error: null, offline: !getNetworkStatus().isConnected });
    try {
      const [locations, posts, events, checkIns, summary] = await Promise.all([
        api.listLocations({ lakeId: id }),
        api.listLakeFeed(id),
        api.listEvents(id),
        api.listActiveCheckIns(id),
        api.getLakeSummary(id),
      ]);

      memoryCache.set(id, {
        at: Date.now(),
        locations,
        posts,
        events,
        checkIns,
        summary,
      });

      set({
        locations,
        posts,
        events,
        checkIns,
        summary,
        cacheUpdatedAt: Date.now(),
        status: "ready",
        offline: false,
        activeMineId:
          checkIns.find(
            (c) =>
              c.user_id === useAuthStore.getState().session?.user?.id &&
              c.status === "active"
          )?.id ?? null,
      });
    } catch (e) {
      logger.error("store.refreshLake", e);
      if (cached) {
        set({
          locations: cached.locations,
          posts: cached.posts,
          events: cached.events,
          checkIns: cached.checkIns,
          summary: cached.summary,
          status: "ready",
          error: "Showing cached data (offline or error)",
          offline: !getNetworkStatus().isConnected,
        });
        return;
      }
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Failed to refresh lake",
        offline: !getNetworkStatus().isConnected,
      });
    }
  },

  dropAnchor: async (input) => {
    const userId = useAuthStore.getState().session?.user?.id;
    const lakeId = get().activeLakeId;
    if (!userId || !lakeId) throw new Error("Sign in required");
    const created = await api.createCheckIn({
      ...input,
      lakeId,
      userId,
      photoUrl: input.photoUrl,
    });
    memoryCache.delete(lakeId);
    set({ activeMineId: created.id });
    await get().refreshLake(lakeId);
  },

  endCheckIn: async (checkInId) => {
    await api.endCheckIn(checkInId);
    set({ activeMineId: null });
    const lakeId = get().activeLakeId;
    if (lakeId) {
      memoryCache.delete(lakeId);
      await get().refreshLake(lakeId);
    }
  },

  extendCheckIn: async (checkInId, extraMinutes) => {
    assertOnlineSafe();
    const expiresAt = new Date(Date.now() + extraMinutes * 60_000).toISOString();
    const { getSupabase } = await import("@/lib/supabase/client");
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase
      .from("check_ins")
      .update({ expires_at: expiresAt })
      .eq("id", checkInId);
    if (error) throw error;
    const lakeId = get().activeLakeId;
    if (lakeId) {
      memoryCache.delete(lakeId);
      await get().refreshLake(lakeId);
    }
  },

  toggleLike: async (postId) => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) throw new Error("Sign in required");
    const result = await api.toggleLike(postId, userId);
    set({
      posts: get().posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: result.liked,
              like_count: Math.max(0, (p.like_count ?? 0) + (result.liked ? 1 : -1)),
            }
          : p
      ),
    });
  },

  addComment: async (postId, text) => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) throw new Error("Sign in required");
    await api.addComment(postId, userId, text);
    set({
      posts: get().posts.map((p) =>
        p.id === postId
          ? { ...p, comment_count: (p.comment_count ?? 0) + 1 }
          : p
      ),
    });
  },

  createEvent: async (input) => {
    const userId = useAuthStore.getState().session?.user?.id;
    const lakeId = get().activeLakeId;
    if (!userId || !lakeId) throw new Error("Sign in required");
    await api.createEvent({
      organizerId: userId,
      lakeId,
      locationId: input.locationId,
      title: input.title,
      description: input.description,
      category: input.category,
      startsAt: input.startsAt,
      coverPhotoUrl: input.coverPhotoUrl,
    });
    memoryCache.delete(lakeId);
    await get().refreshLake(lakeId);
  },

  rsvpEvent: async (eventId, going) => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) throw new Error("Sign in required");
    await api.rsvpEvent(eventId, userId, going);
    set({
      events: get().events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              going,
              rsvp_count: Math.max(0, (e.rsvp_count ?? 0) + (going ? 1 : -1)),
            }
          : e
      ),
    });
  },
}));

/** @deprecated expireDue removed — server cron handles expiry */
export function expireDue() {
  /* no-op in production */
}
