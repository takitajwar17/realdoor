import "server-only";

import {
  AGENT_DISCOVERY_LINK_HEADER,
  CANONICAL_SITE_URL,
  MARKDOWN_CONTENT_TYPE,
} from "@/constants";

export interface MarkdownPayload {
  body: string;
  extraHeaders?: HeadersInit;
}

const homepageHowItWorksSteps = [
  "Upload synthetic household documents such as pay statements and benefits letters.",
  "Confirm only allowlisted facts with source evidence before anything is reused.",
  "See cited program rules and deterministic income math—never an eligibility decision.",
  "Build a checklist-aware, renter-controlled packet you can preview, download, and delete.",
  "Create a free account to start a private practice session.",
] as const;

export function countEstimatedMarkdownTokens(markdown: string): string {
  return String(Math.max(1, Math.ceil(markdown.length / 4)));
}

function toAbsoluteUrl(path: string): string {
  return new URL(path, CANONICAL_SITE_URL).toString();
}

function createFrontmatter(input: {
  title: string;
  description: string;
  canonicalPath: string;
  updatedAt?: string;
}) {
  const lines = [
    "---",
    `title: ${input.title}`,
    `description: ${input.description}`,
    `canonical: ${toAbsoluteUrl(input.canonicalPath)}`,
  ];

  if (input.updatedAt) {
    lines.push(`updated_at: ${input.updatedAt}`);
  }

  lines.push("---");

  return lines.join("\n");
}

function buildHomepageMarkdown(): MarkdownPayload {
  const body = [
    createFrontmatter({
      title: "RealDoor",
      description:
        "Application-readiness copilot that turns household documents into confirmed facts, cited rules, and a renter-controlled packet.",
      canonicalPath: "/",
    }),
    "# RealDoor",
    ...homepageHowItWorksSteps.map((step, index) => `${index + 1}. ${step}`),
    "## Key links",
    `- Login: ${toAbsoluteUrl("/sign-in")}`,
    `- Sign up: ${toAbsoluteUrl("/sign-up")}`,
    `- API catalog: ${toAbsoluteUrl("/.well-known/api-catalog")}`,
  ].join("\n\n");

  return {
    body,
    extraHeaders: {
      Link: AGENT_DISCOVERY_LINK_HEADER,
    },
  };
}

export function getPublicMarkdownPayload(pathname: string): MarkdownPayload | null {
  if (pathname === "/") {
    return buildHomepageMarkdown();
  }

  return null;
}

export function getPublicMarkdownContentType() {
  return MARKDOWN_CONTENT_TYPE;
}
