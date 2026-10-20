export const BUSINESS = {
  name: "Rochester Mobile Auto Repair",
  shortName: "RMAR",
  tagline: "Quality Repairs. At Your Location.",
  phoneDisplay: "(248) 928-4118",
  phoneTel: "+12489284118",
  email: "service@rochestermobileautorepair.com",
  serviceAreaSummary:
    "Rochester, Rochester Hills, Auburn Hills, Washington Township, Shelby Township, Troy, and surrounding Oakland and Macomb County communities.",
  counties: ["Oakland County", "Macomb County"],
  hoursPlaceholder: [
    { day: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
    { day: "Saturday", hours: "9:00 AM – 2:00 PM" },
    { day: "Sunday", hours: "By appointment" },
  ],
  hoursNote:
    "Hours are placeholders and can be updated before launch. Availability may vary by day and location.",
} as const;

export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rochestermobileautorepair.com",
  ogImage: "/og-image.svg",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book Service" },
  { href: "/about", label: "About" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/contact", label: "Contact" },
] as const;

export const SERVICE_TYPES = [
  "Engine Diagnostics",
  "Brake Repair",
  "Battery Testing & Replacement",
  "Oil Changes",
  "General Automotive Repairs",
  "Preventative Maintenance",
  "Other / Not Sure",
] as const;

export const TIME_WINDOWS = [
  "Morning (8 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 6 PM)",
  "Flexible / Anytime",
] as const;
