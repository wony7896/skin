"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");

  const h = await headers();
  const origin =
    h.get("origin") ??
    (h.get("host") ? `https://${h.get("host")}` : "http://localhost:3000");

  const supabase = await createClient();
  // 재설정 링크 → /auth/confirm(verifyOtp)에서 세션을 세운 뒤 비밀번호 변경 화면으로
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/account/password`,
  });

  // 계정 존재 여부를 노출하지 않기 위해 항상 같은 응답을 준다
  return {
    message:
      "입력하신 주소로 가입된 계정이 있다면 비밀번호 재설정 메일을 보냈어요.",
  };
}
