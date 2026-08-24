"use server";

import { db } from "@/db";
import { userConsents } from "@/db/schema";
import type { ConsentType } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

export async function grantConsent(consentType: ConsentType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  await db
    .insert(userConsents)
    .values({ userId: user.id, consentType })
    .onConflictDoNothing();

  return { success: true as const };
}
