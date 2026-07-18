import { notFound, redirect } from "next/navigation";

import { getReadinessSession } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export default async function ReadinessSessionPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const auth = await requireVerifiedPageSession(`/dashboard/${appId}`);

  try {
    await getReadinessSession(appId, auth.userId);
  } catch {
    notFound();
  }
  redirect(`/dashboard/${appId}/profile`);
}
