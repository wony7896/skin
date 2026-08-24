"use client";

import { useState, useTransition } from "react";
import {
  confirmSuspectedIngredients,
  submitTroubleReport,
  type ImplicatedIngredient,
} from "@/app/report/actions";
import { PhotoUpload } from "@/components/photo/PhotoUpload";
import { SliderField } from "@/components/onboarding/primitives";

type Stage =
  | { step: "form" }
  | { step: "confirm"; ingredients: ImplicatedIngredient[] }
  | { step: "done"; addedCount: number };

export function ReportForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [bodyArea, setBodyArea] = useState("");
  const [onsetDays, setOnsetDays] = useState(2);
  const [severity, setSeverity] = useState(3);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [stage, setStage] = useState<Stage>({ step: "form" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmitReport() {
    if (!productId) {
      setError("제품을 선택해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitTroubleReport({
        productId,
        bodyArea,
        onsetDays,
        severity,
        photoPath,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setChecked(
        Object.fromEntries(res.ingredients.map((i) => [i.id, true])),
      );
      setStage({ step: "confirm", ingredients: res.ingredients });
    });
  }

  function handleConfirm() {
    if (stage.step !== "confirm") return;
    const selected = stage.ingredients
      .filter((i) => checked[i.id])
      .map((i) => i.id);

    startTransition(async () => {
      const res = await confirmSuspectedIngredients(selected);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setStage({ step: "done", addedCount: selected.length });
    });
  }

  if (stage.step === "done") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          리포트가 접수됐어요
        </h1>
        <p className="mt-2 text-neutral-500">
          {stage.addedCount > 0
            ? `${stage.addedCount}개 성분을 의심 성분 리스트에 추가했어요.`
            : "선택한 성분이 없어 제외 리스트는 변경하지 않았어요."}
        </p>
      </div>
    );
  }

  if (stage.step === "confirm") {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          이 성분들이 의심돼요
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          선택한 제품에 포함된 성분이에요. 제외 리스트에 추가할 성분을
          골라주세요.
        </p>

        {stage.ingredients.length === 0 ? (
          <p className="mb-6 text-sm text-neutral-500">
            이 제품의 성분 정보가 아직 없어요. 리포트만 접수할게요.
          </p>
        ) : (
          <div className="mb-6 space-y-2">
            {stage.ingredients.map((ingredient) => (
              <label
                key={ingredient.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked[ingredient.id] ?? false}
                  onChange={(e) =>
                    setChecked((prev) => ({
                      ...prev,
                      [ingredient.id]: e.target.checked,
                    }))
                  }
                />
                <span>
                  {ingredient.koreanName ?? ingredient.inciName}
                  <span className="ml-1 text-neutral-400">
                    ({ingredient.inciName})
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "확인"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">
        트러블 반응 리포트
      </h1>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          어떤 제품을 사용했나요?
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          트러블이 난 부위
        </label>
        <input
          type="text"
          value={bodyArea}
          onChange={(e) => setBodyArea(e.target.value)}
          placeholder="예: 볼, 턱선"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          사용 후 며칠 만에 나타났나요?
        </label>
        <SliderField
          min={0}
          max={14}
          value={onsetDays}
          onChange={setOnsetDays}
          formatValue={(v) => `${v}일`}
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          강도 (1~5)
        </label>
        <SliderField min={1} max={5} value={severity} onChange={setSeverity} />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          증상 사진
        </label>
        <PhotoUpload path={photoPath} onChange={setPhotoPath} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmitReport}
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "제출 중..." : "제출"}
      </button>
    </div>
  );
}
