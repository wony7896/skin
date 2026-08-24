"use client";

import { Field, RadioPills, StepHeading } from "./primitives";
import {
  COLOR_FREE_LABELS,
  COLOR_FREE_OPTIONS,
  FRAGRANCE_LEVEL_LABELS,
  FRAGRANCE_LEVEL_OPTIONS,
  TEXTURE_LABELS,
  TEXTURE_OPTIONS,
  type OnboardingData,
} from "./types";

export function StepG({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <StepHeading
        title="사용감 취향"
        description="같은 성분이라도 향·제형이 안 맞으면 계속 쓰기 어렵죠. 원하는 느낌을 알려주세요."
      />

      <Field label="향">
        <RadioPills
          options={FRAGRANCE_LEVEL_OPTIONS}
          labels={FRAGRANCE_LEVEL_LABELS}
          value={data.fragrancePreference ?? "any"}
          onChange={(v) =>
            update({
              fragrancePreference: v === "any" ? null : v,
            })
          }
        />
      </Field>

      <Field label="제형">
        <RadioPills
          options={TEXTURE_OPTIONS}
          labels={TEXTURE_LABELS}
          value={data.texturePreference ?? "any"}
          onChange={(v) =>
            update({
              texturePreference: v === "any" ? null : v,
            })
          }
        />
      </Field>

      <Field label="색상">
        <RadioPills
          options={COLOR_FREE_OPTIONS}
          labels={COLOR_FREE_LABELS}
          value={data.prefersColorFree ? "colorfree" : "any"}
          onChange={(v) =>
            update({ prefersColorFree: v === "colorfree" ? true : null })
          }
        />
      </Field>
    </div>
  );
}
