#!/usr/bin/env node
/**
 * Validates seed locations: no invented coordinates, unique slugs, required fields.
 * Full list lives in lake-st-clair.locations.ts — JSON mirror is generated on demand.
 */
const fs = require("fs");
const path = require("path");

const tsPath = path.join(__dirname, "../supabase/seed/lake-st-clair.locations.ts");
const src = fs.readFileSync(tsPath, "utf8");
const slugMatches = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const coordBlocks = [...src.matchAll(/coordinates:\s*([^,]+)/g)].map((m) => m[1].trim());

const unique = new Set(slugMatches);
if (unique.size !== slugMatches.length) {
  console.error("Duplicate slugs found");
  process.exit(1);
}

const invented = coordBlocks.filter((c) => c !== "null");
if (invented.length) {
  console.error("Seed contains non-null coordinates (not allowed until verified):", invented);
  process.exit(1);
}

const payload = slugMatches.map((slug) => {
  const block = src.split(`slug: "${slug}"`)[1]?.slice(0, 800) ?? "";
  const name = block.match(/name:\s*"([^"]+)"/)?.[1] ?? slug;
  const type = block.match(/type:\s*"([^"]+)"/)?.[1] ?? "social_zone";
  return {
    slug,
    name,
    type,
    coordinates: null,
    boundaryGeoJson: null,
    verificationStatus: "needs_review",
    sourceUrl: null,
    attributes: {
      supportsCheckIn: true,
      supportsLocationFeed: true,
    },
  };
});

const out = path.join(__dirname, "../supabase/seed/lake-st-clair.locations.json");
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
console.log(`Validated ${payload.length} locations → ${out}`);
