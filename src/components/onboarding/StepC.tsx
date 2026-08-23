"use client";

import {
  ChipGroup,
  Field,
  StepHeading,
  TextListInput,
  YesNoToggle,
} from "./primitives";
import {
  REACTION_TYPES,
  REACTION_TYPE_LABELS,
  type OnboardingData,
} from "./types";

export function StepC({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeading
        title="알레르기 · 트러블 유발 이력"
        description="성분 이름을 몰라도 괜찮아요. 어떤 제품이었는지만 알려주시면 저희가 성분을 찾아드려요."
      />

      <Field label="과거 트러블이 났을 때 나타난 증상">
        <ChipGroup
          options={REACTION_TYPES}
          labels={REACTION_TYPE_LABELS}
          selected={data.reactionTypes}
          onChange={(v) => update({ reactionTypes: v })}
        />
      </Field>

      <Field label="트러블이 의심되는 제품">
        <TextListInput
          values={data.suspectedProductNames}
          onChange={(v) => update({ suspectedProductNames: v })}
          placeholder="제품명 (예: OO 브랜드 비타민C 세럼)"
        />
      </Field>

      <Field label="패치테스트를 해본 적 있나요?">
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
