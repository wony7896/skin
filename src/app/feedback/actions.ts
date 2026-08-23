"use server";

import { db } from "@/db";
import { usageFeedback } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function submitFeedback(input: {
  recommendationId: string;
  satisfactionScore: number;
  hadTrouble: boolean;
  repurchaseIntent: boolean;
  feedbackText: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  await db.insert(usageFeedback).values({
    userId: user.id,
    recommendationId: input.recommendationId,
    satisfactionScore: input.satisfactionScore,
    hadTrouble: input.hadTrouble,
    repurchaseIntent: input.repurchaseIntent,
    feedbackText: input.feedbackText || null,
  });

  return { success: true as const };
}
