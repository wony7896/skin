"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantConsent } from "@/app/consent/actions";

export function SensitiveInfoConsentGate() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAgree() {
    if (!checked) {
      setError("동의해야 진단 설문을 시작할 수 있어요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await grantConsent("sensitive_health_info");
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-2 text-xl font-semibold text-neutral-900">
        민감정보 처리 동의
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        진단 설문을 시작하기 전에 확인해주세요.
      </p>

      <div className="mb-6 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <p>
          진단 설문에서 입력하시는 <strong>피부질환 이력, 현재 복용·도포
          중인 약물, 알레르기 반응 이력</strong>은 개인정보보호법상 건강에
          관한 민감정보에 해당할 수 있어요.
        </p>
        <p>
          이 정보는 성분 제외 리스트 생성과 맞춤 추천 목적으로만
          사용되며, 일반 이용약관에 대한 동의와는 별도로 이 정보 처리에
          대한 명시적 동의가 필요합니다.
        </p>
      </div>

      <label className="mb-4 flex items-start gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5"
        />
        위 민감정보 처리에 동의합니다.
      </label>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleAgree}
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "처리 중..." : "동의하고 시작하기"}
      </button>
    </div>
  );
}
