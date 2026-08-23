"use client";

import { Field, RadioPills, SliderField, StepHeading } from "./primitives";
import type { OnboardingData } from "./types";

export function StepA({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeading
        title="기본 피부 특성"
        description="세안 직후 느껴지는 그대로 답해주세요. 정답은 없어요."
      />

      <Field label="세안 후 당김이 느껴지기까지 걸리는 시간">
        <SliderField
          min={0}
          max={60}
          step={5}
          value={data.tightnessMinutes}
          onChange={(v) => update({ tightnessMinutes: v })}
          formatValue={(v) => (v === 0 ? "바로 당김" : `${v}분 이상 안 당김`)}
        />
      </Field>

      <Field label="세안 후 T존이 번들거리기 시작하는 시간">
        <SliderField
          min={0}
          max={180}
          step={10}
          value={data.tZoneShineMinutes}
          onChange={(v) => update({ tZoneShineMinutes: v })}
          formatValue={(v) => (v === 0 ? "바로 번들거림" : `${v}분 후`)}
        />
      </Field>

      <Field label="모공 크기">
        <RadioPills
          options={["small", "medium", "large"] as const}
          labels={{ small: "작음", medium: "보통", large: "큼" }}
          value={data.poreSize}
          onChange={(v) => update({ poreSize: v })}
        />
      </Field>

      <Field label="평소 피부 유분감">
        <RadioPills
          options={["dry", "normal", "oily", "combination"] as const}
          labels={{
            dry: "건성",
            normal: "보통",
            oily: "지성",
            combination: "복합성",
          }}
          value={data.oilinessVisual}
          onChange={(v) => update({ oilinessVisual: v })}
        />
      </Field>
    </div>
  );
}
