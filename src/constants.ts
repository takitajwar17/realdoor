import type { Route } from "next";

export const SITE_NAME = "RealDoor";
export const SITE_DESCRIPTION =
  "AI visa review software for agencies: check client documents, spot missing requirements, manage cases, and send clear follow-ups before submission.";
export const CANONICAL_SITE_URL = "https://hacknation.tajwaruzzaman.workers.dev";
export const CANONICAL_SITE_DOMAIN = "hacknation.tajwaruzzaman.workers.dev";
export const OPEN_GRAPH_IMAGE_PATH = "/og_image.png";
export const OPEN_GRAPH_IMAGE_WIDTH = 1200;
export const OPEN_GRAPH_IMAGE_HEIGHT = 630;
export const SITE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacknation.tajwaruzzaman.workers.dev");
export const API_CATALOG_PATH = "/.well-known/api-catalog";
export const AGENT_SKILLS_SCHEMA_URL = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
export const MCP_ENDPOINT_PATH = "/mcp";
export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const A2A_PROTOCOL_VERSION = "1.0";
export const AGENT_DISCOVERY_LINK_HEADER = `<${API_CATALOG_PATH}>; rel="api-catalog"`;
export const MARKDOWN_AGENT_ROUTE = "/agent-markdown";
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const SITE_DOMAIN = new URL(SITE_URL).hostname;
export const LEGACY_SITE_DOMAINS = [] as const;

// External API endpoints
export const DISPOSABLE_EMAIL_CHECK_URL = "https://disposable.debounce.io";
export const MAILCHECK_API_URL = "https://api.mailcheck.ai";
export const CLOUDFLARE_TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const PASSWORD_RESET_TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60; // 24 hours
export const EMAIL_VERIFICATION_TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60; // 24 hours
export const MAX_SESSIONS_PER_USER = 5;
export const SESSION_COOKIE_NAME = "session";
export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "google-oauth-state";
export const GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME = "google-oauth-code-verifier";
export const GOOGLE_OAUTH_REDIRECT_COOKIE_NAME = "google-oauth-redirect";

export const ADMIN_EMAIL = "support@realdoor.com";

export const REDIRECT_AFTER_SIGN_IN = "/dashboard" as Route;
export const PENDING_VERIFICATION_ROUTE = "/pending-verification" as Route;

// Cache & time durations
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const EMAIL_RESEND_COOLDOWN_MS = 60_000;
