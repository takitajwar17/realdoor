import { CANONICAL_SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/constants";

export const BLUR_FADE_DELAY = 0.15;

/**
 * Global site configuration.
 * All content is tailored to the RealDoor product.
 */
export const siteConfig = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: CANONICAL_SITE_URL,
  keywords: [
    "RealDoor",
    "Affordable Housing",
    "LIHTC",
    "Application Readiness",
    "Document Extraction",
    "Income Limits",
    "Renter Packet",
    "Housing Application",
  ],
  links: {
    email: "support@realdoor.com",
    twitter: "https://twitter.com/takitajwar17",
  },
};

export type SiteConfig = typeof siteConfig;
