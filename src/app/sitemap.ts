import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/services",
    "/book",
    "/about",
    "/service-areas",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: "2026-10-20",
    changeFrequency: route === "" || route === "/services" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
