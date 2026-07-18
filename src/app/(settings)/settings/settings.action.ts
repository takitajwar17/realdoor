"use server";

import { createServerAction, ZSAError } from "zsa";
import { getDB } from "@/db";
import { userTable } from "@/db/schema";
import { requireVerifiedEmail } from "@/utils/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { userSettingsSchema } from "@/schemas/settings.schema";
import { updateAllSessionsOfUser } from "@/infra/kv-session";
import { withRateLimit, RATE_LIMITS } from "@/infra/with-rate-limit";
import { logger } from "@/infra/logger";
import { validateCsrfToken } from "@/infra/csrf";

export const updateUserProfileAction = createServerAction()
  .input(userSettingsSchema)
  .handler(async ({ input }) => {
    return withRateLimit(async () => {
      // Validate CSRF token
      if (!(await validateCsrfToken(input.csrfToken))) {
        throw new ZSAError("FORBIDDEN", "Invalid request");
      }

      const session = await requireVerifiedEmail();
      const db = getDB();

      if (!session?.user?.id) {
        throw new ZSAError("NOT_AUTHORIZED", "Unauthorized");
      }

      try {
        const firstName = input.firstName.trim();
        const lastName = input.lastName.trim();
        await db
          .update(userTable)
          .set({
            firstName,
            lastName,
          })
          .where(eq(userTable.id, session.user.id));

        await updateAllSessionsOfUser(session.user.id);

        revalidatePath("/settings");
        revalidatePath("/dashboard", "layout");
        return { success: true };
      } catch (error) {
        logger.error("Failed to update profile:", { error });
        throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to update profile");
      }
    }, RATE_LIMITS.SETTINGS);
  });
