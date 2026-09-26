"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { skinProfiles, userProfiles } from "@/db/schema";
import { authErrorMessage } from "@/lib/auth-errors";
import { sendSignupWelcomeEmail } from "@/lib/email";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

async function siteOrigin() {
  const h = await headers();
  return (
    h.get("origin") ??
    (h.get("host") ? `https://${h.get("host")}` : "http://localhost:3000")
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: authErrorMessage(error) };
  }

  // 이미 진단을 마친 사용자는 온보딩을 반복하지 않고 추천으로 바로 보낸다
  const [profile] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, data.user.id))
    .limit(1);

  redirect(profile ? "/recommendations" : "/onboarding");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  // 이름·전화번호는 "아이디 찾기"(가입 이메일 조회)의 유일한 근거라 가입 시 필수로 받는다
  if (!name) {
    return { error: "이름을 입력해주세요." as const };
  }
  if (!isValidPhone(phone)) {
    return { error: "전화번호를 정확히 입력해주세요." as const };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  });

  if (error) {
    return { error: authErrorMessage(error) };
  }

  // signUp은 이메일 확인 설정과 무관하게 data.user를 준다 → 복구용 프로필 저장.
  // 실패해도 가입은 막지 않는다(이후 /account/profile에서 보완 가능).
  if (data.user) {
    try {
      await db
        .insert(userProfiles)
        .values({ userId: data.user.id, name, phone })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: { name, phone, updatedAt: new Date() },
        });
    } catch (e) {
      console.error("[signUp] user_profiles insert failed:", e);
    }
  }

  // 이메일 확인(enable_confirmations)이 꺼져 있으면 signUp이 바로 세션을 준다 →
  // 가입 완료 안내 메일을 보내고 앱으로 바로 진입시킨다.
  if (data.session) {
    const sent = await sendSignupWelcomeEmail(email);
    if (!sent.ok) {
      // 메일 실패는 가입을 막지 않는다 — 로그만 남기고 진입은 그대로 진행
      console.error("[signUp] welcome email failed:", sent.error);
    }
    redirect("/onboarding?welcome=1");
  }

  // fallback: 이메일 확인이 켜진 환경 — 링크 인증을 기다린다
  return {
    message: "가입 확인 이메일을 보냈어요. 메일함의 링크를 눌러 인증을 완료해주세요.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
