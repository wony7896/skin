import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { SensitiveInfoConsentGate } from "@/components/consent/SensitiveInfoConsentGate";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { hasConsent } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const consented = await hasConsent(user.id, "sensitive_health_info");

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 설문은 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      <div className="flex justify-end px-4 py-2 text-xs text-neutral-500">
        <span className="mr-2">{user.email}</span>
        <form action={signOut}>
          <button type="submit" className="underline">
            로그아웃
          </button>
        </form>
      </div>
      {consented ? <OnboardingWizard /> : <SensitiveInfoConsentGate />}
    </main>
  );
}
