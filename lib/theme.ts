export const colors = {
  bg: "#05040A",
  bgElevated: "#12101A",
  bgSoft: "#1A1724",
  line: "rgba(255, 255, 255, 0.1)",
  text: "#F7F4FF",
  muted: "rgba(230, 224, 245, 0.68)",
  /** Hot coral — primary CTA / energy */
  action: "#FF3D82",
  actionStrong: "#FF7AB0",
  /** Electric mint — live / online */
  active: "#2EF2C8",
  warn: "#FFC857",
  danger: "#FF5C5C",
  party: "#FF3D82",
  chill: "#6EC8FF",
  family: "#7BD389",
  fishing: "#2EF2C8",
  sports: "#FF9F43",
  food: "#FFC857",
  pinSocial: "#2EF2C8",
  pinService: "#6EC8FF",
  pinEvent: "#FF9F43",
  pinFishing: "#2EF2C8",
  pinAlert: "#FF5C5C",
  water: "#0B3D55",
  land: "#14121C",
  glow: "rgba(255, 61, 130, 0.35)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  brand: {
    fontSize: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
} as const;

export const vibes = [
  { id: "party", label: "Party", color: colors.party },
  { id: "chill", label: "Chill", color: colors.chill },
  { id: "family", label: "Family", color: colors.family },
  { id: "fishing", label: "Fishing", color: colors.fishing },
  { id: "sports", label: "Watersports", color: colors.sports },
  { id: "food", label: "Food & Drinks", color: colors.food },
] as const;

export type VibeId = (typeof vibes)[number]["id"];

export const lakeStClairBounds = {
  ne: { latitude: 42.72, longitude: -82.35 },
  sw: { latitude: 42.28, longitude: -83.05 },
  center: { latitude: 42.48, longitude: -82.7 },
  zoom: 9.2,
} as const;

/** Brand voice for young sandbar / boat-owner social */
export const brand = {
  name: "RaftOff Social",
  tagline: "Find Your Crew. Find Your Spot.",
  pitch: "See who’s out, where the vibe is hot, and pull up.",
} as const;
