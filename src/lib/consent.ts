import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userConsents } from "@/db/schema";

export type ConsentType = "sensitive_health_info" | "biometric_photo";

export async function hasConsent(
  userId: string,
  consentType: ConsentType,
): Promise<boolean> {
  const [row] = await db
    .select({ id: userConsents.id })
    .from(userConsents)
    .where(
      and(
        eq(userConsents.userId, userId),
        eq(userConsents.consentType, consentType),
      ),
    )
    .limit(1);
  return !!row;
}
