"use server";

import { db } from "@/db";
import { skinProfiles, userMedications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { generateRecommendationsForProfile } from "@/lib/recommendation";
import type { OnboardingData } from "@/components/onboarding/types";

export async function submitOnboarding(data: OnboardingData) {
  const { user } = await getSessionUser();

  if (!user) {
    return { error: "로그인이 필요합니다." as const };
  }

  const [profile] = await db
    .insert(skinProfiles)
    .values({
      userId: user.id,
      source: "onboarding",
      tightnessMinutes: data.tightnessMinutes?.toString(),
      tZoneShineMinutes: data.tZoneShineMinutes?.toString(),
      poreSize: data.poreSize,
      oilinessVisual: data.oilinessVisual,
      diagnosedConditions: data.diagnosedConditions,
      recentProcedures: data.recentProcedures || null,
      pregnancyStatus: data.pregnancyStatus,
      pastReactions: data.pastReactions.filter(
        (entry) => entry.productName.trim() !== "",
      ),
      hadPatchTest: data.hadPatchTest,
      atopicFamilyHistory: data.atopicFamilyHistory,
      humidityRegion: data.humidityRegion || null,
      uvExposureHours: data.uvExposureHours?.toString(),
      maskHours: data.maskHours?.toString(),
      sleepHours: data.sleepHours?.toString(),
      stressLevel: data.stressLevel,
      isSmoker: data.isSmoker,
      currentRoutineProducts: data.currentRoutineProducts,
      lastNewProductAt: data.lastNewProductAt
        ? new Date(data.lastNewProductAt)
        : null,
      goals: data.goals,
      goalPriority: data.goalPriority,
      fragrancePreference: data.fragrancePreference,
      texturePreference: data.texturePreference,
      prefersColorFree: data.prefersColorFree,
    })
    .returning({ id: skinProfiles.id });

  const medicationRows = data.medications
    .filter((m) => m.freeTextName.trim() !== "")
    .map((m) => ({
      userId: user.id,
      skinProfileId: profile.id,
      freeTextName: m.freeTextName,
      inputMethod: "search" as const,
    }));

  if (medicationRows.length > 0) {
    await db.insert(userMedications).values(medicationRows);
  }

  // 이 스냅샷에 대한 추천 로그를 이 시점에 한 번 생성한다 (PRD 섹션 2 "시점별 추천 로그").
  // 실패해도 온보딩 제출 자체는 성공 처리하고, /recommendations 렌더에서 재시도된다.
  try {
    await generateRecommendationsForProfile(user.id, profile.id);
  } catch (err) {
    console.error("추천 로그 생성 실패 (온보딩)", err);
  }

  return { success: true as const, profileId: profile.id };
}
