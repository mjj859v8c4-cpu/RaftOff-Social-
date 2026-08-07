import { z } from "zod";

export const vibeSchema = z.enum([
  "party",
  "chill",
  "family",
  "fishing",
  "sports",
  "food",
]);

export const audienceSchema = z.enum([
  "public",
  "followers",
  "friends",
  "crew",
  "private",
]);

export const precisionSchema = z.enum([
  "location",
  "approx",
  "exact_group",
  "hidden",
]);

/** 1h / 2h / 4h, or "rest of day" (client resolves the last to a minute count). */
export const durationChoiceSchema = z.enum(["60", "120", "240", "rest_of_day"]);
export type DurationChoice = z.infer<typeof durationChoiceSchema>;

export const dropAnchorSchema = z.object({
  locationId: z.string().uuid().or(z.string().min(1)),
  vibe: vibeSchema,
  message: z.string().max(180).optional().or(z.literal("")),
  audience: audienceSchema.default("public"),
  precision: precisionSchema.default("location"),
  /** Resolved minutes-until-expiry (rest-of-day is computed client-side from lake tz). */
  durationMinutes: z.number().int().min(15).max(24 * 60),
  durationChoice: durationChoiceSchema.default("120"),
  postToFeed: z.boolean().default(true),
  boatId: z.string().uuid().optional().nullable(),
});

export type DropAnchorInput = z.infer<typeof dropAnchorSchema>;

export const createEventSchema = z.object({
  title: z.string().min(3).max(80),
  locationId: z.string().min(1),
  category: vibeSchema,
  startsAt: z.string().min(1),
  description: z.string().max(500).optional(),
});
