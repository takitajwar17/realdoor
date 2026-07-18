import { CANONICAL_SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/constants";

export const BLUR_FADE_DELAY = 0.15;

/**
 * Global site configuration.
 * All content is tailored to the Vidicy product.
 */
export const siteConfig = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: CANONICAL_SITE_URL,
  keywords: [
    "Vidicy",
    "Visa Application",
    "Visa Rejection",
    "Document Review",
    "Visa Review Software",
    "Schengen Visa",
    "US Visa",
    "UK Visa",
    "Canada Visa",
  ],
  links: {
    email: "support@vidicy.com",
    twitter: "https://twitter.com/takitajwar17",
  },
};

export type SiteConfig = typeof siteConfig;
