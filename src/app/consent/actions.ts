"use server";

import { db } from "@/db";
import { userConsents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { ConsentType } from "@/lib/consent";

export async function grantConsent(consentType: ConsentType) {
  const { user } = await getSessionUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  await db
    .insert(userConsents)
    .values({ userId: user.id, consentType })
    .onConflictDoNothing();

  return { success: true as const };
}
