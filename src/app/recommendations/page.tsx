import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, recommendations, skinProfiles } from "@/db/schema";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  generateRecommendationsForProfile,
  type ProductCategory,
} from "@/lib/recommendation";
import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth";

export default async function RecommendationsPage() {
  const { user } = await requireUser();

  const [latestProfile] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  if (!latestProfile) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">
            아직 진단 결과가 없어요
          </h1>
          <p className="mt-2 text-neutral-500">
            먼저 온보딩 설문을 완료해주세요.
          </p>
        </main>
      </>
    );
  }

  // 추천 로그는 진단 스냅샷이 생길 때(온보딩·체크인 제출) 만들어진다. 여기서는
  // 그게 누락된 경우에만 채우는 방어용 호출 — 내부 존재 체크로 스냅샷당 최대 1회만 INSERT.
  await generateRecommendationsForProfile(user.id, latestProfile.id);

  const rows = await db
    .select({
      category: recommendations.category,
      reason: recommendations.reason,
      goalFitScore: recommendations.goalFitScore,
      productId: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      externalUrl: products.externalUrl,
      retailer: products.retailer,
      country: products.country,
    })
    .from(recommendations)
    .innerJoin(products, eq(products.id, recommendations.productId))
    .where(eq(recommendations.skinProfileId, latestProfile.id))
    .orderBy(desc(recommendations.goalFitScore));

  const byCategory = new Map<ProductCategory, typeof rows>();
  for (const row of rows) {
    const cat = row.category as ProductCategory;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(row);
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-xl font-semibold text-neutral-900">
            맞춤 추천
          </h1>
          <p className="mb-8 text-sm text-neutral-500">
            제외 성분이 없는 제품 중에서, 설정하신 목표에 맞는 순서로 보여드려요.
            가장 최근 진단 기준입니다.
          </p>

          {CATEGORY_ORDER.map((category) => {
            const results = byCategory.get(category) ?? [];
            return (
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
                        <a
                          href={product.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex gap-3"
                        >
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-16 w-16 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">
                              사진 없음
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {product.retailer ?? "판매처 정보 없음"}
                              {product.country !== "KR" &&
                                ` · ${product.country}`}
                            </p>
                            {product.reason && (
                              <p className="mt-1 text-xs text-neutral-500">
                                {product.reason}
                              </p>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
