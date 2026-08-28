import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, recommendations, usageFeedback } from "@/db/schema";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/recommendation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth";

export default async function FeedbackPage() {
  const { user } = await requireUser();

  const allRecommendations = await db
    .select({
      id: recommendations.id,
      productId: recommendations.productId,
      category: recommendations.category,
      productName: products.name,
      recommendedAt: recommendations.recommendedAt,
    })
    .from(recommendations)
    .innerJoin(products, eq(products.id, recommendations.productId))
    .where(eq(recommendations.userId, user.id))
    .orderBy(desc(recommendations.recommendedAt));

  // 제품당 가장 최근 추천 1건만 남긴다 (같은 제품이 여러 번 노출됐을 수 있음)
  const latestByProduct = new Map<string, (typeof allRecommendations)[number]>();
  for (const rec of allRecommendations) {
    if (!latestByProduct.has(rec.productId)) {
      latestByProduct.set(rec.productId, rec);
    }
  }

  const feedbackRows = await db
    .select()
    .from(usageFeedback)
    .where(eq(usageFeedback.userId, user.id));
  const feedbackByRecommendation = new Map(
    feedbackRows.map((f) => [f.recommendationId, f]),
  );

  const items = [...latestByProduct.values()];

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          사용 피드백
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          추천받은 제품을 실제로 사용해보셨다면 만족도를 알려주세요. 다음
          추천을 더 정확하게 만드는 데 쓰여요.
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-400">
            아직 추천받은 제품이 없어요. 먼저 맞춤 추천을 확인해보세요.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="mb-3">
                  <span className="text-xs text-neutral-400">
                    {CATEGORY_LABELS[item.category as ProductCategory]}
                  </span>
                  <p className="font-medium text-neutral-900">
                    {item.productName}
                  </p>
                </div>
                <FeedbackForm
                  recommendationId={item.id}
                  existing={feedbackByRecommendation.get(item.id) ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      </main>
    </>
  );
}
