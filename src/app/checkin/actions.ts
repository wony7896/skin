"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { skinProfiles } from "@/db/schema";
import type { SkinGoal } from "@/components/onboarding/types";
import { createClient } from "@/lib/supabase/server";

export async function submitCheckin(input: {
  troubleAreas: string[];
  photoPath: string | null;
  rednessLevel: number;
  flakingLevel: number;
  oilyDryScore: number;
  recentRecommendationSatisfaction: number;
  sleepHours: number;
  stressLevel: number;
  menstrualCycleChange: string;
  goals: SkinGoal[];
  goalPriority: SkinGoal[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  const [baseline] = await db
    .select()
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  if (!baseline) {
    return {
      success: false as const,
      error: "먼저 온보딩 설문을 완료해주세요." as const,
    };
  }

  await db.insert(skinProfiles).values({
    userId: user.id,
    source: "checkin",

    // 변경 없이 베이스라인에서 그대로 이어받는 필드 (A~E 대부분)
    tightnessMinutes: baseline.tightnessMinutes,
    tZoneShineMinutes: baseline.tZoneShineMinutes,
    poreSize: baseline.poreSize,
    oilinessVisual: baseline.oilinessVisual,
    sensitiveResistantScore: baseline.sensitiveResistantScore,
    pigmentationScore: baseline.pigmentationScore,
    wrinkleScore: baseline.wrinkleScore,
    uvReactionType: baseline.uvReactionType,
    acneSeverity: baseline.acneSeverity,
    eczemaPoemScore: baseline.eczemaPoemScore,
    diagnosedConditions: baseline.diagnosedConditions,
    recentProcedures: baseline.recentProcedures,
    pastReactions: baseline.pastReactions,
    hadPatchTest: baseline.hadPatchTest,
    atopicFamilyHistory: baseline.atopicFamilyHistory,
    pregnancyStatus: baseline.pregnancyStatus,
    humidityRegion: baseline.humidityRegion,
    uvExposureHours: baseline.uvExposureHours,
    maskHours: baseline.maskHours,
    isSmoker: baseline.isSmoker,
    currentRoutineProducts: baseline.currentRoutineProducts,
    lastNewProductAt: baseline.lastNewProductAt,

    // 이번 체크인에서 실제로 갱신하는 필드
    oilyDryScore: input.oilyDryScore,
    troubleAreas: input.troubleAreas,
    photoUrl: input.photoPath,
    rednessLevel: input.rednessLevel,
    flakingLevel: input.flakingLevel,
    recentRecommendationSatisfaction: input.recentRecommendationSatisfaction,
    sleepHours: input.sleepHours.toString(),
    stressLevel: input.stressLevel,
    menstrualCycleChange: input.menstrualCycleChange || null,
    goals: input.goals,
    goalPriority: input.goalPriority,
  });

  return { success: true as const };
}
