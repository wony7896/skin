"use client";

import { useState, useTransition } from "react";
import { submitCheckin } from "@/app/checkin/actions";
import {
  Field,
  SliderField,
  StepHeading,
  TextListInput,
} from "@/components/onboarding/primitives";
import { PhotoUpload } from "@/components/photo/PhotoUpload";
import { SKIN_GOAL_LABELS, type SkinGoal } from "@/components/onboarding/types";

const ALL_GOALS = Object.keys(SKIN_GOAL_LABELS) as SkinGoal[];
const MAX_PRIORITY = 2;

type Baseline = {
  oilyDryScore: number | null;
  recentRecommendationSatisfaction: number | null;
  sleepHours: string | null;
  stressLevel: number | null;
  goals: string[];
  goalPriority: string[];
};

export function CheckinForm({ baseline }: { baseline: Baseline }) {
  const [troubleAreas, setTroubleAreas] = useState<string[]>([]);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [rednessComparison, setRednessComparison] = useState<
    "increased" | "decreased" | "similar" | null
  >(null);
  const [rednessLevel, setRednessLevel] = useState(2);
  const [flakingLevel, setFlakingLevel] = useState(2);
  const [oilyDryScore, setOilyDryScore] = useState(
    baseline.oilyDryScore ?? 50,
  );
  const [satisfaction, setSatisfaction] = useState(
    baseline.recentRecommendationSatisfaction ?? 3,
  );
  const [sleepHours, setSleepHours] = useState(
    Number(baseline.sleepHours ?? 6),
  );
  const [stressLevel, setStressLevel] = useState(baseline.stressLevel ?? 3);
  const [menstrualCycleChange, setMenstrualCycleChange] = useState("");

  const baselineGoals = baseline.goals as SkinGoal[];
  const baselineGoalPriority = baseline.goalPriority as SkinGoal[];
  const [goalsMode, setGoalsMode] = useState<"unchanged" | "editing">(
    baselineGoals.length > 0 ? "unchanged" : "editing",
  );
  const [goals, setGoals] = useState<SkinGoal[]>(baselineGoals);
  const [goalPriority, setGoalPriority] = useState<SkinGoal[]>(
    baselineGoalPriority,
  );

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleGoal(goal: SkinGoal) {
    const selected = goals.includes(goal)
      ? goals.filter((g) => g !== goal)
      : [...goals, goal];
    setGoals(selected);
    setGoalPriority(goalPriority.filter((g) => selected.includes(g)));
  }

  function togglePriority(goal: SkinGoal) {
    if (goalPriority.includes(goal)) {
      setGoalPriority(goalPriority.filter((g) => g !== goal));
      return;
    }
    if (goalPriority.length >= MAX_PRIORITY) return;
    setGoalPriority([...goalPriority, goal]);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await submitCheckin({
        troubleAreas,
        photoPath,
        rednessLevel,
        flakingLevel,
        oilyDryScore,
        recentRecommendationSatisfaction: satisfaction,
        sleepHours,
        stressLevel,
        menstrualCycleChange,
        goals,
        goalPriority,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          체크인이 완료됐어요
        </h1>
        <p className="mt-2 text-neutral-500">
          변화가 프로필에 반영됐어요. 다음 체크인은 2주 후에 만나요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <StepHeading
        title="단축 체크인"
        description="1분이면 충분해요. 지난 진단 이후 달라진 점만 알려주세요."
      />

      <Field label="최근 2주간 트러블이 난 부위">
        <TextListInput
          values={troubleAreas}
          onChange={setTroubleAreas}
          addLabel="+ 부위 추가"
          placeholder="예: 턱선, 볼"
        />
      </Field>

      <Field label="피부 사진">
        <PhotoUpload
          path={photoPath}
          onChange={setPhotoPath}
          onAnalyzed={setRednessComparison}
        />
        <p className="mt-1 text-xs text-neutral-400">
          업로드하면 직전 체크인 사진과 색상을 비교해 홍조가 늘었는지
          줄었는지 참고로 알려드려요 (간단한 색상 분석이라 절대적인 수치는
          아니에요).
        </p>
      </Field>

      <Field label="홍조 정도">
        <SliderField min={0} max={5} value={rednessLevel} onChange={setRednessLevel} />
        {rednessComparison && rednessComparison !== "similar" && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
            <span>
              {rednessComparison === "increased"
                ? "사진 분석 결과 직전보다 붉은기가 있어 보여요."
                : "사진 분석 결과 직전보다 붉은기가 덜해 보여요."}
            </span>
            <button
              type="button"
              onClick={() => {
                const delta = rednessComparison === "increased" ? 1 : -1;
                setRednessLevel((v) => Math.max(0, Math.min(5, v + delta)));
                setRednessComparison(null);
              }}
              className="rounded-full border border-amber-400 px-2 py-0.5 hover:bg-amber-50"
            >
              반영
            </button>
            <button
              type="button"
              onClick={() => setRednessComparison(null)}
              className="text-neutral-400 underline"
            >
              무시
            </button>
          </div>
        )}
      </Field>

      <Field label="각질 정도">
        <SliderField min={0} max={5} value={flakingLevel} onChange={setFlakingLevel} />
      </Field>

      <Field label="유분 정도 (0: 매우 건조 · 100: 매우 유분기)">
        <SliderField
          min={0}
          max={100}
          step={5}
          value={oilyDryScore}
          onChange={setOilyDryScore}
        />
      </Field>

      <Field label="최근 추천받은 제품에 얼마나 만족했나요? (1~5)">
        <SliderField min={1} max={5} value={satisfaction} onChange={setSatisfaction} />
      </Field>

      <Field label="스킨케어 목표">
        {goalsMode === "unchanged" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-600">
              {baselineGoals.length > 0
                ? baselineGoals.map((g) => SKIN_GOAL_LABELS[g]).join(", ")
                : "설정된 목표 없음"}
            </span>
            <button
              type="button"
              onClick={() => setGoalsMode("editing")}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-neutral-400"
            >
              수정하기
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {ALL_GOALS.map((goal) => {
                const active = goals.includes(goal);
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
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => {
                  const rank = goalPriority.indexOf(goal);
                  const active = rank !== -1;
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => togglePriority(goal)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-neutral-300 bg-white text-neutral-700"
                      }`}
                    >
                      {active ? `${rank + 1}순위 · ` : ""}
                      {SKIN_GOAL_LABELS[goal]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Field>

      <Field label="하루 평균 수면 시간">
        <SliderField min={0} max={12} value={sleepHours} onChange={setSleepHours} />
      </Field>

      <Field label="평소 스트레스 정도 (1~5)">
        <SliderField min={1} max={5} value={stressLevel} onChange={setStressLevel} />
      </Field>

      <Field label="생리주기 변화 (해당 시)">
        <input
          type="text"
          value={menstrualCycleChange}
          onChange={(e) => setMenstrualCycleChange(e.target.value)}
          placeholder="해당 없으면 비워두세요"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "체크인 완료"}
      </button>
    </div>
  );
}
