"use server";
import { createServerAction, ZSAError } from "zsa";
import { z } from "zod";
import { getDB } from "@/db";
import { enterpriseInquiryTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/utils/auth";

export const updateEnterpriseInquiryStatusAction = createServerAction()
  .input(z.object({
    id: z.string().min(1),
    status: z.enum(["new", "contacted", "closed"]),
    adminNote: z.string().max(2000).optional(),
  }))
  .handler(async ({ input }) => {
    const session = await requireAdmin({ doNotThrowError: true });
    if (!session) throw new ZSAError("NOT_AUTHORIZED", "You must be an admin to perform this action");

    const db = getDB();
    const [updated] = await db
      .update(enterpriseInquiryTable)
      .set({
        status: input.status,
        adminNote: input.adminNote ?? null,
      })
      .where(eq(enterpriseInquiryTable.id, input.id))
      .returning();

    return updated;
  });
