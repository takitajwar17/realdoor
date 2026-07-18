"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/settings",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/pending-verification",
  "/sso",
];

export function PublicAnalytics() {
  const pathname = usePathname();
  if (PRIVATE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="oZe+17dcsEEpe8y02wK7mA"
        strategy="lazyOnload"
      />
      <Script
        src="https://aromatic-caribou-889.convex.site/api/a/am_rLALT9FXrq74hEOQ"
        strategy="lazyOnload"
      />
    </>
  );
}
