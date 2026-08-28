"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userConsents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { ConsentType } from "@/lib/consent";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요." as const };
  }
  if (password !== confirm) {
    return { error: "두 비밀번호가 일치하지 않아요." as const };
  }

  const { supabase, user } = await getSessionUser();
  if (!user) {
    return { error: "로그인이 필요합니다." as const };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { message: "비밀번호를 변경했어요." as const };
}

export async function revokeConsent(consentType: ConsentType) {
  const { user } = await getSessionUser();
  if (!user) {
    return { success: false as const, error: "로그인이 필요합니다." as const };
  }

  await db
    .delete(userConsents)
    .where(
      and(
        eq(userConsents.userId, user.id),
        eq(userConsents.consentType, consentType),
      ),
    );

  return { success: true as const };
}

export async function deleteAccount(formData: FormData) {
  const confirmation = String(formData.get("confirmation") ?? "");

  const { supabase, user } = await getSessionUser();
  if (!user) {
    return { error: "로그인이 필요합니다." as const };
  }

  if (confirmation.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { error: "확인을 위해 이메일 주소를 정확히 입력해주세요." as const };
  }

  // 1. 스토리지(skin-photos) 본인 파일 삭제 — FK가 없어 계정 삭제로는 정리되지 않음
  const { data: files } = await supabase.storage
    .from("skin-photos")
    .list(user.id, { limit: 1000 });
  if (files && files.length > 0) {
    await supabase.storage
      .from("skin-photos")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // 2. 계정 삭제 — public 테이블 행은 FK ON DELETE CASCADE로 함께 삭제됨
  const { error } = await supabase.rpc("delete_current_user");
  if (error) {
    return {
      error: "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요." as const,
    };
  }

  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
