import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recommendations, skinProfiles } from "@/db/schema";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getRecommendations,
} from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [latestProfile] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  if (!latestProfile) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">
          아직 진단 결과가 없어요
        </h1>
        <p className="mt-2 text-neutral-500">
          먼저 온보딩 설문을 완료해주세요.
        </p>
      </main>
    );
  }

  const resultsByCategory = await Promise.all(
    CATEGORY_ORDER.map(async (category) => {
      const results = await getRecommendations(user.id, category);
      const top = results.slice(0, 3);

      if (top.length > 0) {
        await db.insert(recommendations).values(
          top.map((product) => ({
            userId: user.id,
            skinProfileId: latestProfile.id,
            productId: product.productId,
            category,
            safetyPassed: true,
            goalFitScore: product.score.toString(),
            reason: product.reasons.join(" · ") || "제외 성분 없음",
          })),
        );
      }

      return { category, results: top };
    }),
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          맞춤 추천
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          제외 성분이 없는 제품 중에서, 설정하신 목표에 맞는 순서로 보여드려요.
        </p>

        {resultsByCategory.map(({ category, results }) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">
              {CATEGORY_LABELS[category]}
            </h2>
            {results.length === 0 ? (
              <p className="text-sm text-neutral-400">
                안전 기준을 통과한 제품이 없어요.
              </p>
            ) : (
              <ul className="space-y-2">
                {results.map((product) => (
                  <li
                    key={product.productId}
                    className="rounded-lg border border-neutral-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900">
                        {product.name}
                      </span>
                      <a
                        href={product.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-neutral-500 underline"
                      >
                        보러가기
                      </a>
                    </div>
                    {product.reasons.length > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {product.reasons.join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
