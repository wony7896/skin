"use server";

import { db } from "@/db";
import { skinProfiles, userMedications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
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

  return { success: true as const, profileId: profile.id };
}
