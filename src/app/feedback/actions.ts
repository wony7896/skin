"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { recommendations, usageFeedback } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function submitFeedback(input: {
  recommendationId: string;
  satisfactionScore: number;
  hadTrouble: boolean;
  repurchaseIntent: boolean;
  feedbackText: string;
}) {
  const { user } = await getSessionUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  // recommendationId가 본인 추천인지 확인 — Drizzle 경로는 RLS를 우회하므로 필수
  const [owned] = await db
    .select({ id: recommendations.id })
    .from(recommendations)
    .where(
      and(
        eq(recommendations.id, input.recommendationId),
        eq(recommendations.userId, user.id),
      ),
    )
    .limit(1);
  if (!owned) {
    return { success: false as const, error: "잘못된 요청이에요." as const };
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
