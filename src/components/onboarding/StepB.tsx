"use client";

import { Field, ChipGroup, StepHeading } from "./primitives";
import {
  DIAGNOSED_CONDITIONS,
  DIAGNOSED_CONDITION_LABELS,
  type OnboardingData,
} from "./types";

export function StepB({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  function updateMedicationAt(index: number, name: string) {
    const copy = [...data.medications];
    copy[index] = { freeTextName: name };
    update({ medications: copy });
  }

  function removeMedicationAt(index: number) {
    update({ medications: data.medications.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <StepHeading
        title="피부 질환 병력"
        description="진단받은 적 있는 항목만 선택하면 돼요. 없으면 넘어가도 괜찮아요."
      />

      <Field label="진단받은 적 있는 피부 질환">
        <ChipGroup
          options={DIAGNOSED_CONDITIONS}
          labels={DIAGNOSED_CONDITION_LABELS}
          selected={data.diagnosedConditions}
          onChange={(v) => update({ diagnosedConditions: v })}
        />
      </Field>

      <Field label="현재 복용 중이거나 바르고 있는 약물">
        <div className="space-y-2">
          {data.medications.map((med, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={med.freeTextName}
                placeholder="약 이름 (예: 이소트레티노인 캡슐)"
                onChange={(e) => updateMedicationAt(index, e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeMedicationAt(index)}
                className="rounded-lg border border-neutral-300 px-3 text-sm text-neutral-500 hover:bg-neutral-50"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update({
                medications: [...data.medications, { freeTextName: "" }],
              })
            }
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400"
          >
            + 추가 (약 봉투 사진/바코드 인식은 준비 중 — 우선 이름으로 입력해주세요)
          </button>
        </div>
      </Field>

      <Field label="최근 3개월 내 받은 피부 시술">
        <textarea
          value={data.recentProcedures}
          onChange={(e) => update({ recentProcedures: e.target.value })}
          placeholder="없으면 비워두세요 (예: 레이저 토닝, 필링 등)"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          rows={2}
        />
      </Field>
    </div>
  );
}
