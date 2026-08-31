"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { skinProfiles } from "@/db/schema";
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
    return { error: error.message };
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    message: "가입 확인 이메일을 보냈어요. 메일함의 링크를 눌러 인증을 완료해주세요.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
