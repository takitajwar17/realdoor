import { getCloudflareContext } from "@opennextjs/cloudflare";
import OpenAI from "openai";

function resolveApiKey(cfEnvKey: string, processEnvKey: string): string | undefined {
  let apiKey: string | undefined;
  try {
    const { env } = getCloudflareContext();
    apiKey = (env as unknown as Record<string, string | undefined>)[cfEnvKey];
  } catch {
    // Not running inside a Cloudflare Workers context (e.g. local Next.js dev)
  }
  return apiKey || process.env[processEnvKey];
}

export function getOpenAIClient(): OpenAI {
  const apiKey = resolveApiKey("OPENAI_API_KEY", "OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}
