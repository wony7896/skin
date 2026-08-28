import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 이메일 확인 링크(가입 확인·비밀번호 재설정)의 착지점.
// Supabase가 보내는 링크는 ?token_hash=...&type=... 형식이며, 여기서
// verifyOtp로 세션을 세운 뒤 목적지로 리다이렉트한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  // 오픈 리다이렉트 방지 — 자체 경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=link_invalid", request.url),
  );
}
