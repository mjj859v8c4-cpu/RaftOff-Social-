import type { LucideIcon } from "lucide-react";
import {
  BatteryCharging,
  CircleDot,
  ClipboardCheck,
  Droplets,
  Gauge,
  Wrench,
} from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  symptoms: string[];
  offerings: string[];
  icon: LucideIcon;
  image: string;
  imageAlt: string;
};

export const SERVICES: Service[] = [
  {
    slug: "engine-diagnostics",
    title: "Engine Diagnostics",
    shortTitle: "Engine Diagnostics",
    summary:
      "Computerized diagnostics to identify check-engine lights, drivability issues, and performance problems.",
    description:
      "When a warning light appears or your vehicle starts acting differently, accurate diagnostics save time and prevent unnecessary parts replacement. Our mobile diagnostic service brings scan tools and inspection expertise to your driveway so you can understand what is happening before repairs begin.",
    symptoms: [
      "Check engine light is on",
      "Rough idle, hesitation, or loss of power",
      "Unusual smells, smoke, or exhaust changes",
      "Reduced fuel economy or hard starting",
    ],
    offerings: [
      "OBD-II scanning and code interpretation",
      "Live data review for common faults",
      "Visual inspection of related systems",
      "Clear next-step recommendations",
    ],
    icon: Gauge,
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Technician reviewing vehicle diagnostic information under the hood",
  },
  {
    slug: "brake-repair",
    title: "Brake Repair",
    shortTitle: "Brake Repair",
    summary:
      "Inspection and repair support for braking performance, noise, vibration, and wear-related concerns.",
    description:
      "Reliable brakes are essential for everyday driving confidence. We inspect pads, rotors, hardware, and related components at your location and discuss findings before any work proceeds, so you know what is needed and why.",
    symptoms: [
      "Squealing, grinding, or metallic brake noise",
      "Longer stopping distances",
      "Steering wheel or pedal vibration when braking",
      "Brake warning light or soft pedal feel",
    ],
    offerings: [
      "Brake system inspection",
      "Pad and rotor assessment",
      "Hardware and wear evaluation",
      "Repair recommendations based on findings",
    ],
    icon: CircleDot,
    image:
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Close view of a vehicle brake rotor and caliper during service",
  },
  {
    slug: "battery-testing-replacement",
    title: "Battery Testing & Replacement",
    shortTitle: "Battery Service",
    summary:
      "On-site battery testing, charging system checks, and replacement when a weak or failing battery is confirmed.",
    description:
      "Slow starts and electrical quirks often point to battery or charging issues. We test battery health and related connections at your location so you can avoid unexpected no-start situations whenever possible.",
    symptoms: [
      "Slow or delayed engine cranking",
      "Clicking sounds when starting",
      "Dim lights or intermittent electronics",
      "Battery warning light on the dash",
    ],
    offerings: [
      "Battery load and condition testing",
      "Terminal and cable inspection",
      "Charging system checks",
      "Battery replacement when needed",
    ],
    icon: BatteryCharging,
    image:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Automotive battery connected for testing and service",
  },
  {
    slug: "oil-changes",
    title: "Oil Changes",
    shortTitle: "Oil Changes",
    summary:
      "Convenient oil and filter service performed at your home, office, or driveway on a schedule that fits your day.",
    description:
      "Regular oil changes help protect your engine without requiring a trip to a crowded shop. We perform mobile oil service with attention to the correct viscosity and filter fitment for your vehicle.",
    symptoms: [
      "Oil life monitor or service reminder is due",
      "Oil appears dark or low on the dipstick",
      "It has been longer than recommended since the last change",
      "You want maintenance without leaving home or work",
    ],
    offerings: [
      "Engine oil and filter service",
      "Fluid level visual checks",
      "Basic under-hood inspection",
      "Maintenance recommendations",
    ],
    icon: Droplets,
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Fresh motor oil being poured during an oil change",
  },
  {
    slug: "general-automotive-repairs",
    title: "General Automotive Repairs",
    shortTitle: "General Repairs",
    summary:
      "Practical mobile repairs for everyday mechanical issues that can be completed safely at your location.",
    description:
      "From common wear items to drivability concerns, many repairs can be handled without a shop visit. After inspection, we explain the issue in plain language and outline practical options before starting work.",
    symptoms: [
      "Unusual noises while driving or idling",
      "Fluid leaks under the vehicle",
      "Vibration, pulling, or handling changes",
      "Components that need replacement after inspection",
    ],
    offerings: [
      "On-site inspection and troubleshooting",
      "Common component repairs",
      "Fluid leak evaluation",
      "Transparent repair recommendations",
    ],
    icon: Wrench,
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Mechanic using tools while working on a vehicle",
  },
  {
    slug: "preventative-maintenance",
    title: "Preventative Maintenance",
    shortTitle: "Preventative Maintenance",
    summary:
      "Scheduled inspections and maintenance that help catch wear early and keep your vehicle dependable.",
    description:
      "Preventative care is one of the simplest ways to reduce unexpected breakdowns. We review key systems, discuss what is due based on mileage and condition, and help you plan service before small issues become larger ones.",
    symptoms: [
      "Upcoming mileage-based service intervals",
      "Seasonal driving preparation needs",
      "Older vehicle with deferred maintenance",
      "Desire for a proactive inspection before travel",
    ],
    offerings: [
      "Multi-point visual inspections",
      "Fluid and filter maintenance planning",
      "Wear-item assessments",
      "Service scheduling guidance",
    ],
    icon: ClipboardCheck,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Well-maintained vehicle representing preventative automotive care",
  },
];

export function getServiceBySlug(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}
