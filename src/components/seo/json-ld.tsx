import { BUSINESS, SITE } from "@/lib/constants";

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "LocalBusiness"],
    name: BUSINESS.name,
    description:
      "Mobile auto repair serving Rochester, Rochester Hills, and surrounding Oakland and Macomb County communities in Michigan.",
    url: SITE.url,
    telephone: BUSINESS.phoneTel,
    image: `${SITE.url}${SITE.ogImage}`,
    areaServed: [
      "Rochester, MI",
      "Rochester Hills, MI",
      "Auburn Hills, MI",
      "Washington Township, MI",
      "Shelby Township, MI",
      "Troy, MI",
      "Oakland County, MI",
      "Macomb County, MI",
    ],
    serviceType: [
      "Engine Diagnostics",
      "Brake Repair",
      "Battery Testing & Replacement",
      "Oil Changes",
      "General Automotive Repairs",
      "Preventative Maintenance",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "14:00",
      },
    ],
    priceRange: "$$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
