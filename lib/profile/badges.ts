/**
 * Boating badges — user-selectable identity chips shown on profiles.
 * Stored alongside earned badges in `profiles.badges` (text[]).
 *
 * "Earned" badges (founding-member, creator, co-founder, founder) are granted
 * by the system/migrations and must never be added or removed via the picker —
 * see RESERVED_BADGE_IDS + mergeBadgeSelection below ("founding-member stays").
 */

export type BoatingBadge = { id: string; label: string; emoji: string };

export const BOATING_BADGES: BoatingBadge[] = [
  { id: "boat-owner", label: "Boat Owner", emoji: "🚤" },
  { id: "angler", label: "Angler", emoji: "🎣" },
  { id: "lake-local", label: "Lake Local", emoji: "📍" },
  { id: "marina-member", label: "Marina Member", emoji: "⚓" },
  { id: "safety-conscious", label: "Safety Conscious", emoji: "🦺" },
  { id: "captain", label: "Captain", emoji: "🧭" },
  { id: "water-sports", label: "Water Sports", emoji: "🏄" },
  { id: "weekend-warrior", label: "Weekend Warrior", emoji: "🌊" },
  { id: "sunset-cruiser", label: "Sunset Cruiser", emoji: "🌅" },
];

export const BOATING_BADGE_IDS = BOATING_BADGES.map((b) => b.id);

/** Earned/system badges — never surfaced in (or touched by) the selectable picker. */
export const RESERVED_BADGE_IDS = ["founding-member", "creator", "co-founder", "founder"];

/**
 * Combine a user's picker selection with whatever earned/reserved badges already
 * exist on the profile, so saving the picker can never drop a founding-member
 * (or other earned) badge, and can never grant one either.
 */
export function mergeBadgeSelection(
  existingBadges: string[] | null | undefined,
  selectedBoatingBadgeIds: string[]
): string[] {
  const reservedKept = (existingBadges ?? []).filter((id) => RESERVED_BADGE_IDS.includes(id));
  const selected = selectedBoatingBadgeIds.filter((id) => BOATING_BADGE_IDS.includes(id));
  return Array.from(new Set([...reservedKept, ...selected]));
}

export function selectableBadgesFrom(badges: string[] | null | undefined): string[] {
  return (badges ?? []).filter((id) => BOATING_BADGE_IDS.includes(id));
}
