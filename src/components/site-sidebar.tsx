import "server-only";

import { getSessionFromCookie } from "@/utils/auth";
import { AppSidebar } from "@/components/app-sidebar";

/**
 * Server wrapper for the authenticated readiness navigation.
 * The sidebar stays stable across a renter's readiness journey.
 */
export async function SiteSidebar() {
  const session = await getSessionFromCookie();

  if (!session) {
    return null;
  }

  const userProps = {
    name:
      `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() ||
      session.user.email ||
      "User",
    email: session.user.email || "",
    avatar: session.user.avatar ?? "",
  };

  if (!session.user.emailVerified) {
    return <AppSidebar user={userProps} />;
  }

  return <AppSidebar user={userProps} />;
}
