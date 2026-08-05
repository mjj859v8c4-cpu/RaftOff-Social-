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

export const dropAnchorSchema = z.object({
  locationId: z.string().uuid().or(z.string().min(1)),
  vibe: vibeSchema,
  message: z.string().max(180).optional().or(z.literal("")),
  audience: audienceSchema.default("public"),
  precision: precisionSchema.default("location"),
  durationMinutes: z.union([
    z.literal(30),
    z.literal(60),
    z.literal(120),
    z.literal(240),
  ]),
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
