import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { skinProfiles } from "@/db/schema";
import { SensitiveInfoConsentGate } from "@/components/consent/SensitiveInfoConsentGate";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AppHeader } from "@/components/AppHeader";
import { hasConsent } from "@/lib/consent";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { user } = await requireUser();
  const { welcome } = await searchParams;

  // 이미 진단을 마친 사용자는 온보딩을 반복하지 않는다 — 이후 갱신은 체크인으로.
  // (온보딩을 또 제출하면 중복 진단 스냅샷·추천 세트가 생긴다.)
  const [existingProfile] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);
  if (existingProfile) {
    redirect("/recommendations");
  }

  const consented = await hasConsent(user.id, "sensitive_health_info");

  return (
    <main className="min-h-screen bg-neutral-50">
      <AppHeader />
      {welcome && (
        <div className="border-b border-neutral-200 bg-green-50 px-4 py-2 text-center text-sm text-green-800">
          회원가입이 완료됐어요. 가입 안내 메일도 보내드렸어요.
        </div>
      )}
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 설문은 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      {consented ? <OnboardingWizard /> : <SensitiveInfoConsentGate />}
    </main>
  );
}
