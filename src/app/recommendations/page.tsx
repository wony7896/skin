import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recommendations, skinProfiles } from "@/db/schema";
import {
  AVAILABLE_COUNTRIES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getRecommendations,
} from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ intl?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { intl } = await searchParams;
  const includeInternational = intl === "1";
  // MVP 기본은 국내(KR)만, 토글로 해외(KR 외 전체)를 옵트인 — PRD 섹션 4 "국내 우선" 결정
  const selectedCountries = includeInternational
    ? AVAILABLE_COUNTRIES.map((c) => c.code)
    : ["KR"];

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
      const results = await getRecommendations(
        user.id,
        category,
        selectedCountries,
      );
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

        {/* 해외 포함 토글 UI는 숨김 처리 — ?intl=1 쿼리 파라미터로는 여전히 동작함.
            2026-08-26 세션에는 국내(KR) 카테고리가 비어 있어 임시로 노출했었으나,
            5개 카테고리 모두 실제 KR 제품 5개(브랜드 18종 다양화)로 채워지면서
            PRD 섹션 4 "국내 우선" 원안대로 다시 숨김. 로직은 살아있으니 필요해지면
            이 자리에 토글만 추가하면 된다. */}

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
                          {product.country !== "KR" && ` · ${product.country}`}
                        </p>
                        {product.reasons.length > 0 && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {product.reasons.join(" · ")}
                          </p>
                        )}
                      </div>
                    </a>
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
