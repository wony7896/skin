import { SensitiveInfoConsentGate } from "@/components/consent/SensitiveInfoConsentGate";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AppHeader } from "@/components/AppHeader";
import { hasConsent } from "@/lib/consent";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const { user } = await requireUser();

  const consented = await hasConsent(user.id, "sensitive_health_info");

  return (
    <main className="min-h-screen bg-neutral-50">
      <AppHeader />
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 설문은 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      {consented ? <OnboardingWizard /> : <SensitiveInfoConsentGate />}
    </main>
  );
}
