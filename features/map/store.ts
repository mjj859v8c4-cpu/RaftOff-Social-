import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Audience, CheckIn, LakeEvent, Location, Post, Precision } from "@/types/raftoff";
import { buildMichiganSeedLocations } from "@/supabase/seed/michigan-places";
import { getLakeById, MICHIGAN_LAKES } from "@/supabase/seed/michigan-lakes";
import {
  buildLakeStClairHotspots,
  hotspotTypeToLocationType,
} from "@/supabase/seed/lake-st-clair-hotspots";
import type { DropAnchorInput } from "@/lib/validation";
import { track } from "@/lib/analytics";

const DEMO_USER = {
  id: "demo-user",
  username: "raftoff_you",
  display_name: "You",
};

/** Older Michigan seed slugs → Corey’s verified St. Clair hotspot ids */
const ST_CLAIR_SLUG_ALIASES: Record<string, string> = {
  "gull-island-sc": "gull-island",
  "metro-beach-offshore": "metro-beach",
  "st-clair-flats-zone": "st-clair-flats",
};

function seedToLocations(): Location[] {
  const fromMichigan = buildMichiganSeedLocations().map((s) => ({
    id: `loc-${s.slug}`,
    lake_id: s.lakeId,
    slug: s.slug,
    name: s.name,
    type: s.type,
    description: s.attributes.regionHint ?? null,
    public_access: s.attributes.publicAccess ?? null,
    resident_only: s.attributes.residentOnly ?? false,
    attributes: {
      ...s.attributes,
      displayLat: s.displayLat,
      displayLng: s.displayLng,
    } as Record<string, unknown>,
    verification_status: s.verificationStatus,
    status: "active" as const,
    latitude: s.displayLat,
    longitude: s.displayLng,
    active_check_ins: 0,
    dominant_vibe: null,
    last_activity_at: null,
  }));

  const bySlug = new Map(fromMichigan.map((l) => [l.slug, l]));

  for (const [oldSlug, newSlug] of Object.entries(ST_CLAIR_SLUG_ALIASES)) {
    const loc = bySlug.get(oldSlug);
    if (!loc) continue;
    bySlug.delete(oldSlug);
    if (!bySlug.has(newSlug)) {
      bySlug.set(newSlug, { ...loc, slug: newSlug, id: `loc-${newSlug}` });
    }
  }

  // Verified Lake St. Clair coords are source of truth for the 26 hotspots
  for (const h of buildLakeStClairHotspots()) {
    const existing = bySlug.get(h.id);
    const mappedType = hotspotTypeToLocationType(h.type);
    if (existing) {
      const keepDining =
        existing.type === "restaurant" ||
        existing.type === "fuel" ||
        existing.type === "bait" ||
        existing.type === "marine_service";
      bySlug.set(h.id, {
        ...existing,
        name: h.name,
        type: keepDining ? existing.type : mappedType,
        latitude: h.lat,
        longitude: h.lng,
        verification_status: "verified",
        attributes: {
          ...(existing.attributes as Record<string, unknown>),
          displayLat: h.lat,
          displayLng: h.lng,
          hotspotType: h.type,
        } as Record<string, unknown>,
      });
    } else {
      bySlug.set(h.id, {
        id: `loc-${h.id}`,
        lake_id: "lake-st-clair",
        slug: h.id,
        name: h.name,
        type: mappedType,
        description: null,
        public_access: null,
        resident_only: false,
        attributes: {
          displayLat: h.lat,
          displayLng: h.lng,
          hotspotType: h.type,
        } as Record<string, unknown>,
        verification_status: "verified",
        status: "active",
        latitude: h.lat,
        longitude: h.lng,
        active_check_ins: 0,
        dominant_vibe: null,
        last_activity_at: null,
      });
    }
  }

  return Array.from(bySlug.values());
}

function demoCheckIns(locations: Location[]): CheckIn[] {
  const picks = [
    { slug: "strawberry-island", author: "Maya", vibe: "party", message: "Raft-up growing — friendly crews." },
    { slug: "torch-sandbar", author: "Chris", vibe: "chill", message: "Water is unreal today. Sandbar’s filling up." },
    { slug: "west-arm-raftup", author: "Avery", vibe: "party", message: "West Arm sunset raft forming." },
    { slug: "gull-lake-narrows", author: "Sam", vibe: "family", message: "Family float near the narrows." },
    { slug: "scotty-s-nautical-mile", author: "Riley", vibe: "food", message: "Docked for dinner on the Mile." },
  ];
  return picks
    .map((p, i) => {
      const loc = locations.find((l) => l.slug === p.slug);
      if (!loc) return null;
      return {
        id: `seed-ci-${i}`,
        user_id: `user-${p.author.toLowerCase()}`,
        lake_id: loc.lake_id,
        location_id: loc.id,
        vibe: p.vibe,
        message: p.message,
        audience: "public" as Audience,
        precision: "location" as Precision,
        starts_at: new Date(Date.now() - (i + 1) * 18 * 60000).toISOString(),
        expires_at: new Date(Date.now() + (100 - i * 12) * 60000).toISOString(),
        status: "active" as const,
        profile: {
          id: `user-${p.author.toLowerCase()}`,
          username: p.author.toLowerCase(),
          display_name: p.author,
        },
        location: loc,
      };
    })
    .filter(Boolean) as CheckIn[];
}

function enrichLocations(locations: Location[], checkIns: CheckIn[]): Location[] {
  const now = Date.now();
  const active = checkIns.filter(
    (c) => c.status === "active" && new Date(c.expires_at).getTime() > now && !c.ended_at
  );
  return locations.map((loc) => {
    const at = active.filter((c) => c.location_id === loc.id);
    const vibeCounts: Record<string, number> = {};
    at.forEach((c) => {
      vibeCounts[c.vibe] = (vibeCounts[c.vibe] ?? 0) + 1;
    });
    const dominant =
      Object.keys(vibeCounts).sort((a, b) => vibeCounts[b] - vibeCounts[a])[0] ?? null;
    return {
      ...loc,
      active_check_ins: at.length,
      dominant_vibe: dominant,
      last_activity_at: at[0]?.starts_at ?? loc.last_activity_at,
    };
  });
}

interface RaftOffState {
  hydrated: boolean;
  activeLakeId: string;
  locations: Location[];
  checkIns: CheckIn[];
  posts: Post[];
  events: LakeEvent[];
  activeMineId: string | null;
  selectedLocationId: string | null;
  mapFilter: string;
  setActiveLakeId: (id: string) => void;
  setMapFilter: (v: string) => void;
  selectLocation: (id: string | null) => void;
  dropAnchor: (input: DropAnchorInput) => CheckIn;
  endCheckIn: (id: string) => void;
  extendCheckIn: (id: string, minutes: number) => void;
  toggleLike: (postId: string) => void;
  rsvpEvent: (eventId: string) => void;
  createEvent: (input: {
    title: string;
    locationId: string;
    category: string;
    startsAt: string;
  }) => void;
  expireDue: () => void;
  locationsForActiveLake: () => Location[];
  diningForActiveLake: () => Location[];
  getSummary: () => {
    lake_name: string;
    active_check_ins: number;
    active_hotspots: number;
    top_spot: string | null;
    updated_at: string;
  };
  getLocationFeed: (
    locationId: string,
    tab: "live" | "recent" | "fishing" | "events" | "info"
  ) => { checkIns: CheckIn[]; posts: Post[]; events: LakeEvent[]; location: Location | undefined };
}

function buildInitial() {
  const locations = seedToLocations();
  const checkIns = demoCheckIns(locations);
  const posts: Post[] = checkIns.map((c) => ({
    id: `post-${c.id}`,
    author_id: c.user_id,
    lake_id: c.lake_id,
    location_id: c.location_id,
    check_in_id: c.id,
    post_type: "check_in",
    text: c.message,
    audience: "public",
    moderation_status: "visible",
    created_at: c.starts_at,
    profile: c.profile,
    location: c.location,
    like_count: Math.floor(Math.random() * 6) + 1,
    comment_count: Math.floor(Math.random() * 3),
    liked_by_me: false,
  }));
  const events: LakeEvent[] = [
    {
      id: "evt-1",
      organizer_id: "user-maya",
      lake_id: "lake-st-clair",
      location_id: "loc-strawberry-island",
      title: "Saturday sandbar raft-up",
      category: "party",
      starts_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      visibility: "public",
      status: "scheduled",
      rsvp_count: 28,
      going: false,
      location: locations.find((l) => l.slug === "strawberry-island"),
    },
    {
      id: "evt-2",
      organizer_id: "user-chris",
      lake_id: "torch-lake",
      location_id: "loc-torch-sandbar",
      title: "Torch sandbar afternoon",
      category: "chill",
      starts_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      visibility: "public",
      status: "scheduled",
      rsvp_count: 41,
      going: false,
      location: locations.find((l) => l.slug === "torch-sandbar"),
    },
    {
      id: "evt-3",
      organizer_id: "user-avery",
      lake_id: "lake-michigan-gtb",
      location_id: "loc-west-arm-raftup",
      title: "West Arm sunset raft",
      category: "party",
      starts_at: new Date(Date.now() + 4 * 86400000).toISOString(),
      visibility: "public",
      status: "scheduled",
      rsvp_count: 19,
      going: false,
      location: locations.find((l) => l.slug === "west-arm-raftup"),
    },
  ];
  return {
    locations: enrichLocations(locations, checkIns),
    checkIns,
    posts,
    events,
  };
}

const initial = buildInitial();

export const useRaftOffStore = create<RaftOffState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      activeLakeId: MICHIGAN_LAKES[0].id,
      locations: initial.locations,
      checkIns: initial.checkIns,
      posts: initial.posts,
      events: initial.events,
      activeMineId: null,
      selectedLocationId: null,
      mapFilter: "all",
      setActiveLakeId: (id) => {
        track("lake_switch", { lake_id: id });
        set({ activeLakeId: id, selectedLocationId: null, mapFilter: "all" });
      },
      setMapFilter: (v) => {
        track("map_filter", { filter: v, lake_id: get().activeLakeId });
        set({ mapFilter: v });
      },
      selectLocation: (id) => {
        if (id) {
          const loc = get().locations.find((l) => l.id === id);
          track("pin_tap", {
            lake_id: get().activeLakeId,
            location_id: id,
            location_slug: loc?.slug,
            location_type: loc?.type,
          });
        }
        set({ selectedLocationId: id });
      },
      locationsForActiveLake: () => {
        const { locations, activeLakeId } = get();
        return locations.filter((l) => l.lake_id === activeLakeId);
      },
      diningForActiveLake: () => {
        const { locations, activeLakeId } = get();
        return locations.filter(
          (l) => l.lake_id === activeLakeId && (l.type === "restaurant" || l.attributes?.group === "dining")
        );
      },
      expireDue: () => {
        const now = Date.now();
        set((state) => {
          const checkIns = state.checkIns.map((c) =>
            c.status === "active" && new Date(c.expires_at).getTime() <= now
              ? { ...c, status: "expired" as const }
              : c
          );
          return {
            checkIns,
            locations: enrichLocations(state.locations, checkIns),
          };
        });
      },
      dropAnchor: (input) => {
        const loc = get().locations.find((l) => l.id === input.locationId);
        if (!loc) throw new Error("Location not found");
        const checkIn: CheckIn = {
          id: `ci-${Date.now()}`,
          user_id: DEMO_USER.id,
          lake_id: loc.lake_id,
          location_id: loc.id,
          vibe: input.vibe,
          message: input.message || null,
          audience: input.audience,
          precision: input.precision,
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + input.durationMinutes * 60000).toISOString(),
          status: "active",
          profile: DEMO_USER,
          location: loc,
        };
        set((state) => {
          let checkIns = [checkIn, ...state.checkIns];
          let posts = state.posts;
          if (input.postToFeed && input.precision !== "hidden") {
            posts = [
              {
                id: `post-${checkIn.id}`,
                author_id: DEMO_USER.id,
                lake_id: loc.lake_id,
                location_id: loc.id,
                check_in_id: checkIn.id,
                post_type: "check_in",
                text: checkIn.message ?? `Dropped anchor at ${loc.name}`,
                audience: input.audience,
                moderation_status: "visible",
                created_at: checkIn.starts_at,
                profile: DEMO_USER,
                location: loc,
                like_count: 0,
                comment_count: 0,
                liked_by_me: false,
              },
              ...posts,
            ];
          }
          return {
            checkIns,
            posts,
            activeMineId: checkIn.id,
            locations: enrichLocations(state.locations, checkIns),
            selectedLocationId: loc.id,
          };
        });
        track("drop_anchor_submit", {
          lake_id: loc.lake_id,
          location_id: loc.id,
          vibe: input.vibe,
        });
        return checkIn;
      },
      endCheckIn: (id) => {
        set((state) => {
          const checkIns = state.checkIns.map((c) =>
            c.id === id
              ? { ...c, status: "ended" as const, ended_at: new Date().toISOString() }
              : c
          );
          return {
            checkIns,
            activeMineId: state.activeMineId === id ? null : state.activeMineId,
            locations: enrichLocations(state.locations, checkIns),
          };
        });
      },
      extendCheckIn: (id, minutes) => {
        set((state) => {
          const checkIns = state.checkIns.map((c) =>
            c.id === id
              ? {
                  ...c,
                  expires_at: new Date(
                    Math.max(Date.now(), new Date(c.expires_at).getTime()) + minutes * 60000
                  ).toISOString(),
                  status: "active" as const,
                }
              : c
          );
          return { checkIns, locations: enrichLocations(state.locations, checkIns) };
        });
      },
      toggleLike: (postId) => {
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            const liked = !p.liked_by_me;
            return {
              ...p,
              liked_by_me: liked,
              like_count: Math.max(0, (p.like_count ?? 0) + (liked ? 1 : -1)),
            };
          }),
        }));
      },
      rsvpEvent: (eventId) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            const going = !e.going;
            return {
              ...e,
              going,
              rsvp_count: Math.max(0, (e.rsvp_count ?? 0) + (going ? 1 : -1)),
            };
          }),
        }));
      },
      createEvent: (input) => {
        const loc = get().locations.find((l) => l.id === input.locationId);
        set((state) => ({
          events: [
            {
              id: `evt-${Date.now()}`,
              organizer_id: DEMO_USER.id,
              lake_id: loc?.lake_id ?? get().activeLakeId,
              location_id: input.locationId,
              title: input.title,
              category: input.category,
              starts_at: input.startsAt,
              visibility: "public",
              status: "scheduled",
              rsvp_count: 1,
              going: true,
              location: loc,
            },
            ...state.events,
          ],
        }));
      },
      getSummary: () => {
        get().expireDue();
        const lake = getLakeById(get().activeLakeId);
        const locations = get().locationsForActiveLake();
        const now = Date.now();
        const active = get().checkIns.filter(
          (c) =>
            c.lake_id === lake.id &&
            c.status === "active" &&
            new Date(c.expires_at).getTime() > now &&
            c.precision !== "hidden"
        );
        const hotspots = locations.filter((l) => (l.active_check_ins ?? 0) > 0).length;
        const top = [...locations].sort(
          (a, b) => (b.active_check_ins ?? 0) - (a.active_check_ins ?? 0)
        )[0];
        return {
          lake_name: lake.name,
          active_check_ins: active.length,
          active_hotspots: hotspots,
          top_spot: top && (top.active_check_ins ?? 0) > 0 ? top.name : null,
          updated_at: new Date().toISOString(),
        };
      },
      getLocationFeed: (locationId, tab) => {
        get().expireDue();
        const state = get();
        const location = state.locations.find((l) => l.id === locationId);
        const now = Date.now();
        const checkIns = state.checkIns.filter((c) => {
          if (c.location_id !== locationId) return false;
          if (tab === "live") {
            return (
              c.status === "active" &&
              new Date(c.expires_at).getTime() > now &&
              c.precision !== "hidden"
            );
          }
          return true;
        });
        const posts = state.posts.filter((p) => {
          if (p.location_id !== locationId) return false;
          if (tab === "fishing")
            return p.post_type === "fishing_report" || p.text?.toLowerCase().includes("fish");
          if (tab === "live") {
            const age = now - new Date(p.created_at).getTime();
            return age < 6 * 3600000;
          }
          return tab === "recent" || tab === "info" || tab === "events";
        });
        const events =
          tab === "events" || tab === "info"
            ? state.events.filter((e) => e.location_id === locationId)
            : [];
        return { checkIns, posts, events, location };
      },
    }),
    {
      name: "raftoff-local-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        activeLakeId: s.activeLakeId,
        checkIns: s.checkIns,
        posts: s.posts,
        events: s.events,
        activeMineId: s.activeMineId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.locations = enrichLocations(seedToLocations(), state.checkIns);
          state.hydrated = true;
        }
      },
    }
  )
);
