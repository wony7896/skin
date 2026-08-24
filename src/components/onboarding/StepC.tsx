"use client";

import { ChipGroup, Field, SliderField, StepHeading, YesNoToggle } from "./primitives";
import { REACTION_TYPES, REACTION_TYPE_LABELS, type OnboardingData } from "./types";
import type { PastReactionEntry } from "@/db/schema/profiles";
import { DermatologistAdvisory } from "@/components/safety/DermatologistAdvisory";
import { needsDermatologistAdvisory } from "@/lib/safety";

const EMPTY_ENTRY: PastReactionEntry = {
  productName: "",
  reactionTypes: [],
  severity: 2,
  wasPatchTested: false,
};

export function StepC({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  function updateEntry(index: number, patch: Partial<PastReactionEntry>) {
    const copy = [...data.pastReactions];
    copy[index] = { ...copy[index], ...patch };
    update({ pastReactions: copy });
  }

  function removeEntry(index: number) {
    update({ pastReactions: data.pastReactions.filter((_, i) => i !== index) });
  }

  const anyNeedsAdvisory = data.pastReactions.some((entry) =>
    needsDermatologistAdvisory({
      severity: entry.severity,
      reactionTypes: entry.reactionTypes,
    }),
  );

  return (
    <div>
      <StepHeading
        title="알레르기 · 트러블 유발 이력"
        description="성분 이름을 몰라도 괜찮아요. 어떤 제품이었는지만 알려주시면 저희가 성분을 찾아드려요."
      />

      {anyNeedsAdvisory && <DermatologistAdvisory />}

      <Field label="트러블이 났던 경험이 있나요? (있는 만큼 추가해주세요)">
        <div className="space-y-4">
          {data.pastReactions.map((entry, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 p-3"
            >
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={entry.productName}
                  onChange={(e) =>
                    updateEntry(index, { productName: e.target.value })
                  }
                  placeholder="제품명 (예: OO 브랜드 비타민C 세럼)"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="rounded-lg border border-neutral-300 px-3 text-sm text-neutral-500 hover:bg-neutral-50"
                >
                  삭제
                </button>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-xs text-neutral-500">
                  어떤 반응이었나요?
                </p>
                <ChipGroup
                  options={REACTION_TYPES}
                  labels={REACTION_TYPE_LABELS}
                  selected={entry.reactionTypes}
                  onChange={(v) => updateEntry(index, { reactionTypes: v })}
                />
              </div>

              <div className="mb-3">
                <p className="mb-1 text-xs text-neutral-500">강도 (1~5)</p>
                <SliderField
                  min={1}
                  max={5}
                  value={entry.severity}
                  onChange={(v) => updateEntry(index, { severity: v })}
                />
              </div>

              <div>
                <p className="mb-1 text-xs text-neutral-500">
                  이 제품으로 패치테스트를 해봤나요?
                </p>
                <YesNoToggle
                  value={entry.wasPatchTested}
                  onChange={(v) => updateEntry(index, { wasPatchTested: v })}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update({ pastReactions: [...data.pastReactions, EMPTY_ENTRY] })
            }
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400"
          >
            + 트러블 경험 추가
          </button>
        </div>
      </Field>

      <Field label="위 사례와 무관하게, 패치테스트를 해본 적이 있나요?">
        <YesNoToggle
          value={data.hadPatchTest}
          onChange={(v) => update({ hadPatchTest: v })}
        />
      </Field>

      <Field label="아토피 가족력이 있나요?">
        <YesNoToggle
          value={data.atopicFamilyHistory}
          onChange={(v) => update({ atopicFamilyHistory: v })}
        />
      </Field>
    </div>
  );
}
