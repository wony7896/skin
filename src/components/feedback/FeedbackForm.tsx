"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/app/feedback/actions";
import type { usageFeedback } from "@/db/schema";

type ExistingFeedback = typeof usageFeedback.$inferSelect;

export function FeedbackForm({
  recommendationId,
  existing,
}: {
  recommendationId: string;
  existing: ExistingFeedback | null;
}) {
  const [submitted, setSubmitted] = useState(existing);
  const [satisfactionScore, setSatisfactionScore] = useState(4);
  const [hadTrouble, setHadTrouble] = useState<boolean | null>(null);
  const [repurchaseIntent, setRepurchaseIntent] = useState<boolean | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className="text-sm text-neutral-500">
        만족도 {submitted.satisfactionScore}/5 · 트러블{" "}
        {submitted.hadTrouble ? "있었음" : "없었음"} · 재구매 의사{" "}
        {submitted.repurchaseIntent ? "있음" : "없음"} — 피드백 감사해요!
      </p>
    );
  }

  function handleSubmit() {
    if (hadTrouble === null || repurchaseIntent === null) {
      setError("트러블 여부와 재구매 의사를 선택해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitFeedback({
        recommendationId,
        satisfactionScore,
        hadTrouble,
        repurchaseIntent,
        feedbackText,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSubmitted({
        id: "",
        userId: "",
        recommendationId,
        satisfactionScore,
        hadTrouble,
        repurchaseIntent,
        feedbackText: feedbackText || null,
        createdAt: new Date(),
      });
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500">
          만족도 (1~5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={satisfactionScore}
          onChange={(e) => setSatisfactionScore(Number(e.target.value))}
          className="w-full accent-neutral-900"
        />
        <div className="text-xs text-neutral-500">{satisfactionScore}</div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500">트러블이 있었나요?</span>
        <ToggleButtons value={hadTrouble} onChange={setHadTrouble} />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500">재구매 의사가 있나요?</span>
        <ToggleButtons value={repurchaseIntent} onChange={setRepurchaseIntent} />
      </div>

      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="추가로 남기고 싶은 후기 (선택)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        rows={2}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "피드백 제출"}
      </button>
    </div>
  );
}

function ToggleButtons({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-full border px-3 py-1 text-xs ${
          value === true
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 bg-white text-neutral-700"
        }`}
      >
        예
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-full border px-3 py-1 text-xs ${
          value === false
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 bg-white text-neutral-700"
        }`}
      >
        아니요
      </button>
    </div>
  );
}
