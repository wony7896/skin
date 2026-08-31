import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  excludedIngredients,
  ingredients,
  products,
  recommendations,
  skinProfiles,
  troubleReports,
} from "@/db/schema";
import { AppHeader } from "@/components/AppHeader";
import {
  CATEGORY_LABELS,
  GOAL_LABELS,
  type ProductCategory,
  type SkinGoal,
} from "@/lib/recommendation";
import { requireUser } from "@/lib/auth";

function fmtDate(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 이전 스냅샷 대비 증감을 "(+2)" / "(−1)" 형태로. 첫 스냅샷이거나 값이 같으면 빈 문자열. */
function delta(current: number | null, previous: number | null | undefined) {
  if (current == null || previous == null) return "";
  const diff = current - previous;
  if (diff === 0) return "";
  return diff > 0 ? ` (+${diff})` : ` (−${Math.abs(diff)})`;
}

const METRICS: {
  key: "oilyDryScore" | "rednessLevel" | "flakingLevel" | "stressLevel";
  label: string;
  scale: string;
}[] = [
  { key: "oilyDryScore", label: "유분/건성", scale: "0–100" },
  { key: "rednessLevel", label: "홍조", scale: "0–5" },
  { key: "flakingLevel", label: "각질", scale: "0–5" },
  { key: "stressLevel", label: "스트레스", scale: "0–10" },
];

export default async function HistoryPage() {
  const { user } = await requireUser();

  const profilesAsc = await db
    .select()
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(asc(skinProfiles.createdAt));

  const snapshots = profilesAsc
    .map((snap, i) => ({ snap, prev: i > 0 ? profilesAsc[i - 1] : null }))
    .reverse();

  const recRows = await db
    .select({
      skinProfileId: recommendations.skinProfileId,
      productName: products.name,
      category: recommendations.category,
    })
    .from(recommendations)
    .innerJoin(products, eq(products.id, recommendations.productId))
    .where(eq(recommendations.userId, user.id));

  // 추천 로그는 진단 스냅샷당 1세트 — 스냅샷 단위로 묶어 최신순으로 보여준다
  const snapMeta = new Map(
    profilesAsc.map((p) => [
      p.id,
      { date: fmtDate(p.createdAt), source: p.source },
    ]),
  );
  const recByProfile = new Map<string, Map<string, Set<string>>>();
  for (const r of recRows) {
    if (!recByProfile.has(r.skinProfileId))
      recByProfile.set(r.skinProfileId, new Map());
    const cat = CATEGORY_LABELS[r.category as ProductCategory];
    const byCat = recByProfile.get(r.skinProfileId)!;
    if (!byCat.has(cat)) byCat.set(cat, new Set());
    byCat.get(cat)!.add(r.productName);
  }
  const recGroups = profilesAsc
    .filter((p) => recByProfile.has(p.id))
    .reverse()
    .map((p) => ({
      id: p.id,
      meta: snapMeta.get(p.id)!,
      byCat: recByProfile.get(p.id)!,
    }));

  const troubleRows = await db
    .select({
      createdAt: troubleReports.createdAt,
      severity: troubleReports.severity,
      bodyArea: troubleReports.bodyArea,
      productName: products.name,
    })
    .from(troubleReports)
    .leftJoin(products, eq(products.id, troubleReports.productId))
    .where(eq(troubleReports.userId, user.id))
    .orderBy(desc(troubleReports.createdAt));

  const excludedRows = await db
    .select({
      inciName: ingredients.inciName,
      koreanName: ingredients.koreanName,
      status: excludedIngredients.status,
      reportCount: excludedIngredients.reportCount,
      firstReportedAt: excludedIngredients.firstReportedAt,
      lastReportedAt: excludedIngredients.lastReportedAt,
    })
    .from(excludedIngredients)
    .innerJoin(ingredients, eq(ingredients.id, excludedIngredients.ingredientId))
    .where(eq(excludedIngredients.userId, user.id))
    .orderBy(desc(excludedIngredients.lastReportedAt));

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-2xl space-y-10">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">진단 내역</h1>
            <p className="mt-1 text-sm text-neutral-500">
              진단은 덮어쓰지 않고 날짜별로 쌓입니다. 자가 평가 참고용이며,
              의학적 진단이 아닙니다.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              피부 진단 스냅샷 ({profilesAsc.length})
            </h2>
            {snapshots.length === 0 ? (
              <p className="text-sm text-neutral-400">
                아직 진단 기록이 없어요. 온보딩 설문을 완료하면 여기에 쌓입니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {snapshots.map(({ snap, prev }) => {
                  const goals = (snap.goals ?? []) as SkinGoal[];
                  const areas = snap.troubleAreas ?? [];
                  return (
                    <li
                      key={snap.id}
                      className="rounded-lg border border-neutral-200 bg-white p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900">
                          {fmtDate(snap.createdAt)}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                          {snap.source === "onboarding"
                            ? "온보딩 진단"
                            : "체크인"}
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {METRICS.map((m) => {
                          const cur = snap[m.key] as number | null;
                          if (cur == null) return null;
                          const prv = prev
                            ? (prev[m.key] as number | null)
                            : null;
                          return (
                            <div
                              key={m.key}
                              className="flex justify-between gap-2"
                            >
                              <dt className="text-neutral-500">{m.label}</dt>
                              <dd className="text-neutral-900">
                                {cur}
                                <span className="text-neutral-400">
                                  {delta(cur, prv)}
                                </span>
                              </dd>
                            </div>
                          );
                        })}
                        {snap.sleepHours != null && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-neutral-500">수면(시간)</dt>
                            <dd className="text-neutral-900">
                              {Number(snap.sleepHours)}
                              <span className="text-neutral-400">
                                {delta(
                                  Number(snap.sleepHours),
                                  prev?.sleepHours != null
                                    ? Number(prev.sleepHours)
                                    : null,
                                )}
                              </span>
                            </dd>
                          </div>
                        )}
                      </dl>

                      {goals.length > 0 && (
                        <p className="mt-2 text-xs text-neutral-500">
                          목표: {goals.map((g) => GOAL_LABELS[g]).join(", ")}
                        </p>
                      )}
                      {areas.length > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          트러블 부위: {areas.join(", ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">추천 이력</h2>
            <p className="text-xs text-neutral-400">
              진단 스냅샷마다 한 세트씩 생성됩니다.
            </p>
            {recGroups.length === 0 ? (
              <p className="text-sm text-neutral-400">
                아직 추천 기록이 없어요.
              </p>
            ) : (
              <ul className="space-y-3">
                {recGroups.map((g) => (
                  <li
                    key={g.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 text-sm"
                  >
                    <p className="mb-1 font-medium text-neutral-900">
                      {g.meta.date}
                      <span className="ml-2 text-xs font-normal text-neutral-400">
                        {g.meta.source === "onboarding" ? "온보딩" : "체크인"}
                      </span>
                    </p>
                    <ul className="space-y-0.5 text-neutral-600">
                      {[...g.byCat.entries()].map(([cat, names]) => (
                        <li key={cat}>
                          <span className="text-neutral-400">{cat}</span>{" "}
                          {[...names].join(", ")}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              트러블 리포트
            </h2>
            {troubleRows.length === 0 ? (
              <p className="text-sm text-neutral-400">
                접수된 트러블 리포트가 없어요.
              </p>
            ) : (
              <ul className="space-y-2">
                {troubleRows.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                  >
                    <div>
                      <p className="text-neutral-900">
                        {t.productName ?? "제품 미지정"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {fmtDate(t.createdAt)}
                        {t.bodyArea ? ` · ${t.bodyArea}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-600">
                      강도 {t.severity}/5
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              제외 성분 (누적)
            </h2>
            {excludedRows.length === 0 ? (
              <p className="text-sm text-neutral-400">
                제외된 성분이 없어요. 트러블 리포트를 접수하면 의심 성분이 여기에
                쌓입니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {excludedRows.map((e, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-neutral-900">
                        {e.koreanName ?? e.inciName}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          e.status === "confirmed"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {e.status === "confirmed" ? "확정" : "의심"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {e.reportCount}회 보고 · 처음 {fmtDate(e.firstReportedAt)} ·
                      최근 {fmtDate(e.lastReportedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
