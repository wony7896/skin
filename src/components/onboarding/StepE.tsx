"use client";

import { Field, StepHeading } from "./primitives";
import {
  ROUTINE_CATEGORIES,
  ROUTINE_CATEGORY_LABELS,
  type OnboardingData,
} from "./types";
import type { RoutineProductEntry } from "@/db/schema/profiles";

export function StepE({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  function entryFor(category: string): RoutineProductEntry {
    return (
      data.currentRoutineProducts.find((p) => p.category === category) ?? {
        category,
        productName: "",
        frequency: "",
      }
    );
  }

  function updateEntry(category: string, patch: Partial<RoutineProductEntry>) {
    const current = entryFor(category);
    const next = { ...current, ...patch };
    const others = data.currentRoutineProducts.filter(
      (p) => p.category !== category,
    );
    update({
      currentRoutineProducts:
        next.productName.trim() === "" ? others : [...others, next],
    });
  }

  return (
    <div>
      <StepHeading
        title="현재 루틴"
        description="카테고리별로 지금 쓰고 있는 제품을 알려주세요. 안 쓰는 카테고리는 비워두면 돼요."
      />

      {ROUTINE_CATEGORIES.map((category) => {
        const entry = entryFor(category);
        return (
          <Field key={category} label={ROUTINE_CATEGORY_LABELS[category]}>
            <div className="flex gap-2">
              <input
                type="text"
                value={entry.productName}
                onChange={(e) =>
                  updateEntry(category, { productName: e.target.value })
                }
                placeholder="제품명"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={entry.frequency}
                onChange={(e) =>
                  updateEntry(category, { frequency: e.target.value })
                }
                placeholder="사용 빈도 (예: 매일 아침)"
                className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </Field>
        );
      })}

      <Field label="마지막으로 새 제품을 도입한 시점">
        <input
          type="date"
          value={data.lastNewProductAt}
          onChange={(e) => update({ lastNewProductAt: e.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>
    </div>
  );
}
