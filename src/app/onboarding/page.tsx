import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        이 설문은 자가 평가 참고용이며, 의학적 진단이 아닙니다.
      </div>
      <OnboardingWizard />
    </main>
  );
}
