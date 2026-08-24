"use client";

import { Field, SliderField, StepHeading, YesNoToggle } from "./primitives";
import type { OnboardingData } from "./types";

export function StepD({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeading
        title="생활 · 환경 요인"
        description="피부는 환경 영향을 많이 받아요. 대략적인 상태만 알려주세요."
      />

      <Field label="거주 지역의 습도/계절 특징">
        <input
          type="text"
          value={data.humidityRegion}
          onChange={(e) => update({ humidityRegion: e.target.value })}
          placeholder="예: 건조한 내륙 지역, 겨울에 특히 건조"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="하루 평균 자외선 노출 시간">
        <SliderField
          min={0}
          max={12}
          value={data.uvExposureHours}
          onChange={(v) => update({ uvExposureHours: v })}
          formatValue={(v) => `${v}시간`}
        />
      </Field>

      <Field label="하루 평균 마스크 착용 시간">
        <SliderField
          min={0}
          max={12}
          value={data.maskHours}
          onChange={(v) => update({ maskHours: v })}
          formatValue={(v) => `${v}시간`}
        />
      </Field>

      <Field label="하루 평균 수면 시간">
        <SliderField
          min={0}
          max={12}
          value={data.sleepHours}
          onChange={(v) => update({ sleepHours: v })}
          formatValue={(v) => `${v}시간`}
        />
      </Field>

      <Field label="평소 스트레스 정도 (0~10)">
        <SliderField
          min={0}
          max={10}
          value={data.stressLevel}
          onChange={(v) => update({ stressLevel: v })}
        />
      </Field>

      <Field label="흡연 여부">
        <YesNoToggle
          value={data.isSmoker}
          onChange={(v) => update({ isSmoker: v })}
        />
      </Field>
    </div>
  );
}
