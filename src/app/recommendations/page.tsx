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
  searchParams: Promise<{ countries?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { countries: countriesParam } = await searchParams;
  const parsedCountries = countriesParam
    ? countriesParam.split(",").filter(Boolean)
    : ["KR"];
  // 최소 1개 국가는 항상 선택돼 있어야 한다 (전부 해제 시 국내로 되돌림)
  const selectedCountries = parsedCountries.length > 0 ? parsedCountries : ["KR"];

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
        <p className="mb-4 text-sm text-neutral-500">
          제외 성분이 없는 제품 중에서, 설정하신 목표에 맞는 순서로 보여드려요.
        </p>

        <div className="mb-8 flex gap-2">
          {AVAILABLE_COUNTRIES.map((c) => {
            const isActive = selectedCountries.includes(c.code);
            const nextCountries = isActive
              ? selectedCountries.filter((code) => code !== c.code)
              : [...selectedCountries, c.code];
            const href =
              nextCountries.length > 0
                ? `/recommendations?countries=${nextCountries.join(",")}`
                : "/recommendations?countries=";
            return (
              <a
                key={c.code}
                href={href}
                className={`rounded-full border px-3 py-1 text-xs ${
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600"
                }`}
              >
                {c.label}
              </a>
            );
          })}
        </div>

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
