"use client";

import { Field, StepHeading } from "./primitives";
import { SKIN_GOAL_LABELS, type OnboardingData, type SkinGoal } from "./types";

const ALL_GOALS = Object.keys(SKIN_GOAL_LABELS) as SkinGoal[];
const MAX_PRIORITY = 2;

export function StepF({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  function toggleGoal(goal: SkinGoal) {
    const selected = data.goals.includes(goal)
      ? data.goals.filter((g) => g !== goal)
      : [...data.goals, goal];
    update({
      goals: selected,
      goalPriority: data.goalPriority.filter((g) => selected.includes(g)),
    });
  }

  function togglePriority(goal: SkinGoal) {
    if (data.goalPriority.includes(goal)) {
      update({ goalPriority: data.goalPriority.filter((g) => g !== goal) });
      return;
    }
    if (data.goalPriority.length >= MAX_PRIORITY) return;
    update({ goalPriority: [...data.goalPriority, goal] });
  }

  return (
    <div>
      <StepHeading
        title="스킨케어 목표"
        description="원하는 효과를 골라주세요. 그중 가장 중요한 1~2개를 우선순위로 표시하면 추천이 더 정확해져요."
      />

      <Field label="관심 있는 효과 (복수 선택)">
        <div className="flex flex-wrap gap-2">
          {ALL_GOALS.map((goal) => {
            const active = data.goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {SKIN_GOAL_LABELS[goal]}
              </button>
            );
          })}
        </div>
      </Field>

      {data.goals.length > 0 && (
        <Field label={`가장 원하는 것 1~${MAX_PRIORITY}개`}>
          <div className="flex flex-wrap gap-2">
            {data.goals.map((goal) => {
              const rank = data.goalPriority.indexOf(goal);
              const active = rank !== -1;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => togglePriority(goal)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {active ? `${rank + 1}순위 · ` : ""}
                  {SKIN_GOAL_LABELS[goal]}
                </button>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
}
