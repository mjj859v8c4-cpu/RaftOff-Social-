export type ServiceArea = {
  slug: string;
  name: string;
  county: "Oakland" | "Macomb";
  summary: string;
  highlights: string[];
};

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "rochester",
    name: "Rochester",
    county: "Oakland",
    summary:
      "Mobile auto repair for Rochester homeowners, apartments, and workplaces — diagnostics, maintenance, and common repairs brought to your driveway.",
    highlights: [
      "Home and office service appointments",
      "Convenient for downtown and residential neighborhoods",
      "Request availability by phone or online form",
    ],
  },
  {
    slug: "rochester-hills",
    name: "Rochester Hills",
    county: "Oakland",
    summary:
      "Rochester Hills drivers can skip the shop wait. We travel to your location for diagnostics, brakes, batteries, oil service, and general repairs.",
    highlights: [
      "Driveway and workplace service options",
      "Ideal for busy weekday schedules",
      "Clear communication before work begins",
    ],
  },
  {
    slug: "auburn-hills",
    name: "Auburn Hills",
    county: "Oakland",
    summary:
      "Serving Auburn Hills residents and professionals with mobile mechanic service that fits around work and family commitments.",
    highlights: [
      "On-site convenience near home or office",
      "Support for warning lights and maintenance needs",
      "Straightforward appointment requests",
    ],
  },
  {
    slug: "washington-township",
    name: "Washington Township",
    county: "Macomb",
    summary:
      "Washington Township customers can request mobile automotive service without leaving home — practical repairs and maintenance at your location.",
    highlights: [
      "Local Macomb County coverage",
      "Helpful for households managing multiple vehicles",
      "Call to confirm route availability",
    ],
  },
  {
    slug: "shelby-township",
    name: "Shelby Township",
    county: "Macomb",
    summary:
      "Shelby Township is part of our regular service area. Request diagnostics, battery service, oil changes, and more without a repair-shop drop-off.",
    highlights: [
      "Mobile visits across Shelby Township",
      "Flexible preferred time windows",
      "Follow-up communication after your request",
    ],
  },
  {
    slug: "troy",
    name: "Troy",
    county: "Oakland",
    summary:
      "Troy drivers looking for a more convenient repair experience can request Rochester Mobile Auto Repair for on-site automotive service.",
    highlights: [
      "Service at home or workplace when available",
      "Support for everyday repair and maintenance needs",
      "Easy click-to-call and online booking",
    ],
  },
];
