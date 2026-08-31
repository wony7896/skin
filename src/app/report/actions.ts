"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { excludedIngredients, ingredients, productIngredients, troubleReports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export type ImplicatedIngredient = {
  id: string;
  inciName: string;
  koreanName: string | null;
};

export async function submitTroubleReport(input: {
  productId: string;
  bodyArea: string;
  onsetDays: number | null;
  severity: number;
  photoPath: string | null;
}) {
  const { user } = await getSessionUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  const [report] = await db
    .insert(troubleReports)
    .values({
      userId: user.id,
      productId: input.productId,
      bodyArea: input.bodyArea || null,
      onsetDays: input.onsetDays,
      severity: input.severity,
      photoUrl: input.photoPath,
    })
    .returning({ id: troubleReports.id });

  const implicated: ImplicatedIngredient[] = await db
    .select({
      id: ingredients.id,
      inciName: ingredients.inciName,
      koreanName: ingredients.koreanName,
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(eq(productIngredients.productId, input.productId));

  return {
    success: true as const,
    troubleReportId: report.id,
    ingredients: implicated,
  };
}

export async function confirmSuspectedIngredients(ingredientIds: string[]) {
  const { user } = await getSessionUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  if (ingredientIds.length === 0) {
    return { success: true as const };
  }

  await db
    .insert(excludedIngredients)
    .values(
      ingredientIds.map((ingredientId) => ({
        userId: user.id,
        ingredientId,
        source: "event_report" as const,
      })),
    )
    .onConflictDoUpdate({
      target: [excludedIngredients.userId, excludedIngredients.ingredientId],
      set: {
        reportCount: sql`${excludedIngredients.reportCount} + 1`,
        lastReportedAt: sql`now()`,
      },
    });

  return { success: true as const };
}
