"use client";

import { useState, useTransition } from "react";
import { submitOnboarding } from "@/app/onboarding/actions";
import { StepA } from "./StepA";
import { StepB } from "./StepB";
import { StepC } from "./StepC";
import { StepD } from "./StepD";
import { StepE } from "./StepE";
import { StepF } from "./StepF";
import { emptyOnboardingData, type OnboardingData } from "./types";

const STEPS = [
  { key: "A", label: "기본 특성", Component: StepA },
  { key: "B", label: "질환 병력", Component: StepB },
  { key: "C", label: "알레르기", Component: StepC },
  { key: "D", label: "생활 환경", Component: StepD },
  { key: "E", label: "현재 루틴", Component: StepE },
  { key: "F", label: "목표", Component: StepF },
] as const;

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(emptyOnboardingData);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { success: true } | { error: string } | null
  >(null);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const isLastStep = stepIndex === STEPS.length - 1;
  const CurrentStep = STEPS[stepIndex].Component;

  function handleNext() {
    if (isLastStep) {
      startTransition(async () => {
        const res = await submitOnboarding(data);
        setResult(res.error ? { error: res.error } : { success: true });
      });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  if (result && "success" in result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          진단 설문이 완료됐어요
        </h1>
        <p className="mt-2 text-neutral-500">
          자가 평가 참고용 결과이며, 의학적 진단이 아닙니다. 곧 맞춤 추천으로
          이어드릴게요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8 flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-neutral-900" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      <p className="mb-2 text-sm text-neutral-500">
        {stepIndex + 1} / {STEPS.length} · {STEPS[stepIndex].label}
      </p>

      <CurrentStep data={data} update={update} />

      {result && "error" in result && (
        <p className="mb-4 text-sm text-red-600">{result.error}</p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
          disabled={stepIndex === 0}
          className="rounded-lg px-4 py-2 text-sm text-neutral-500 disabled:opacity-0"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "저장 중..." : isLastStep ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
}
