"use server";

import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { skinProfiles } from "@/db/schema";
import {
  compareRednessRatios,
  estimateRednessRatio,
} from "@/lib/skin-photo-analysis";
import { createClient } from "@/lib/supabase/server";

async function downloadAndRatio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
) {
  const { data: blob, error } = await supabase.storage
    .from("skin-photos")
    .download(path);
  if (error || !blob) return null;
  const buffer = Buffer.from(await blob.arrayBuffer());
  return estimateRednessRatio(buffer);
}

export async function analyzeSkinPhoto(path: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  // 스토리지 RLS가 이미 본인 폴더만 다운로드 가능하도록 막아주지만, 경로 형식도 방어적으로 확인
  if (!path.startsWith(`${user.id}/`)) {
    return { success: false as const, error: "잘못된 사진 경로입니다." as const };
  }

  const currentRatio = await downloadAndRatio(supabase, path);
  if (currentRatio === null) {
    return {
      success: false as const,
      error: "사진을 불러오지 못했어요." as const,
    };
  }

  const [previous] = await db
    .select({ photoUrl: skinProfiles.photoUrl })
    .from(skinProfiles)
    .where(
      and(
        eq(skinProfiles.userId, user.id),
        isNotNull(skinProfiles.photoUrl),
        ne(skinProfiles.photoUrl, path),
      ),
    )
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  if (!previous?.photoUrl) {
    return { success: true as const, comparison: null };
  }

  const baselineRatio = await downloadAndRatio(supabase, previous.photoUrl);
  if (baselineRatio === null) {
    return { success: true as const, comparison: null };
  }

  return {
    success: true as const,
    comparison: compareRednessRatios(currentRatio, baselineRatio),
  };
}
