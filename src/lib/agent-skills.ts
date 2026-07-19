import "server-only";

import { Buffer } from "node:buffer";

import { CANONICAL_SITE_URL } from "@/constants";

export interface PublishedAgentSkill {
  slug: string;
  description: string;
  content: string;
}

export interface PublishedAgentSkillIndexEntry {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
  digest: string;
}

function createSkillContent(input: {
  name: string;
  description: string;
  body: string[];
}) {
  return [
    "---",
    `name: ${input.name}`,
    `description: ${input.description}`,
    "---",
    "",
    ...input.body,
    "",
  ].join("\n");
}

const publishedAgentSkills: PublishedAgentSkill[] = [
  {
    slug: "realdoor-public-markdown",
    description:
      "Fetch RealDoor's public marketing pages as markdown with content negotiation for agent-friendly reading.",
    content: createSkillContent({
      name: "realdoor-public-markdown",
      description:
        "Fetch RealDoor's public marketing pages as markdown with content negotiation for agent-friendly reading.",
      body: [
        "# When to use this skill",
        "- You need the markdown version of RealDoor's public pages instead of HTML.",
        "- You want a token-efficient summary source for the homepage.",
        "# Request pattern",
        "- Send Accept: text/markdown",
        "# Supported public markdown routes",
        `- Homepage: ${CANONICAL_SITE_URL}/`,
        "# Expected response",
        "- Content-Type: text/markdown; charset=utf-8",
        "- X-Markdown-Tokens header when markdown is returned",
      ],
    }),
  },
  {
    slug: "realdoor-application-readiness",
    description:
      "Understand RealDoor's authenticated renter readiness workflow: Profile, Understand, Prepare, packet export, and session deletion.",
    content: createSkillContent({
      name: "realdoor-application-readiness",
      description:
        "Understand RealDoor's authenticated renter readiness workflow: Profile, Understand, Prepare, packet export, and session deletion.",
      body: [
        "# When to use this skill",
        "- You need a high-level map of RealDoor's authenticated workflow.",
        "- You want to explain how renters move from document confirmation to a controlled packet.",
        "# Workflow",
        "- Profile: upload synthetic documents, extract allowlisted fields with evidence, and require renter confirmation before reuse.",
        "- Understand: answer supported rules questions from the frozen practice guide and show deterministic income math with citations.",
        "- Prepare: compare the session to a checklist, choose packet contents, preview/download, and delete the session on demand.",
        "# Product boundary",
        "- RealDoor never approves, denies, scores, ranks, or determines eligibility.",
        "- Nothing is auto-sent to a property, landlord, or agency.",
        "# Access requirements",
        "- These routes require a RealDoor account and a readiness session.",
        `- Sign up: ${CANONICAL_SITE_URL}/sign-up`,
        `- Sign in: ${CANONICAL_SITE_URL}/sign-in`,
        `- Dashboard: ${CANONICAL_SITE_URL}/dashboard`,
      ],
    }),
  },
];

export function getPublishedAgentSkills() {
  return publishedAgentSkills;
}

export function getPublishedAgentSkillBySlug(slug: string) {
  return publishedAgentSkills.find((skill) => skill.slug === slug) ?? null;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

export async function getPublishedAgentSkillIndexEntries(): Promise<PublishedAgentSkillIndexEntry[]> {
  const entries = await Promise.all(
    publishedAgentSkills.map(async (skill) => ({
      name: skill.slug,
      type: "skill-md" as const,
      description: skill.description,
      url: `/.well-known/agent-skills/${skill.slug}/SKILL.md`,
      digest: `sha256:${await sha256Hex(skill.content)}`,
    })),
  );

  return entries;
}
