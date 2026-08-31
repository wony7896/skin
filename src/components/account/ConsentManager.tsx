"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeConsent } from "@/app/account/actions";
import type { ConsentType } from "@/lib/consent";

const LABELS: Record<ConsentType, string> = {
  sensitive_health_info: "민감정보 처리 (피부질환 이력·약물·알레르기)",
  biometric_photo: "생체정보 처리 (얼굴 사진 기반 분석)",
};

export function ConsentManager({
  granted,
}: {
  granted: Record<ConsentType, boolean>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<ConsentType | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke(type: ConsentType) {
    setError(null);
    setPendingType(type);
    startTransition(async () => {
      const res = await revokeConsent(type);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const types = Object.keys(LABELS) as ConsentType[];

  return (
    <div className="space-y-3">
      {types.map((type) => (
        <div
          key={type}
          className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm"
        >
          <div>
            <p className="text-neutral-900">{LABELS[type]}</p>
            <p className="text-xs text-neutral-500">
              {granted[type] ? "동의함" : "동의하지 않음"}
            </p>
          </div>
          {granted[type] && (
            <button
              type="button"
              onClick={() => handleRevoke(type)}
              disabled={isPending}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-50"
            >
              {isPending && pendingType === type ? "처리 중..." : "동의 철회"}
            </button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">
        동의를 철회하면 해당 정보가 필요한 진단·추천 기능을 다시 이용할 때
        동의를 새로 받습니다. 이미 저장된 데이터의 완전 삭제를 원하시면
        회원탈퇴를 이용해주세요.
      </p>
    </div>
  );
}
