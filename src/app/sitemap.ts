import { MetadataRoute } from "next";

import { CANONICAL_SITE_URL } from "@/constants";

interface StaticSitemapEntry {
  path: string;
  lastModified: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}

const STATIC_SITEMAP_ENTRIES: StaticSitemapEntry[] = [
  {
    path: "/",
    lastModified: "2026-03-25",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/privacy",
    lastModified: "2026-02-28",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    lastModified: "2026-02-28",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

function parseSitemapDate(value: string): Date | null {
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function lastModified(date: string) {
  return parseSitemapDate(date) ?? new Date("2026-01-01T00:00:00.000Z");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return STATIC_SITEMAP_ENTRIES.map((entry) => ({
    url: entry.path === "/" ? CANONICAL_SITE_URL : `${CANONICAL_SITE_URL}${entry.path}`,
    lastModified: lastModified(entry.lastModified),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
