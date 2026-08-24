import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  excludedIngredients,
  ingredients,
  productIngredients,
  products,
  skinProfiles,
} from "@/db/schema";

export type ProductCategory =
  | "cleansing"
  | "toner"
  | "essence_serum"
  | "cream_lotion"
  | "sunscreen_spot";

export type SkinGoal =
  | "brightening"
  | "wrinkle_elasticity"
  | "pore"
  | "hydration"
  | "trouble_care";

// PRD 섹션 3 "카테고리별 컨선 특화 성분" — 에센스/세럼 표에 명시된 매핑을 기준으로,
// 같은 액티브가 다른 카테고리 제품에도 쓰이면 동일하게 가점한다.
const GOAL_INGREDIENTS: Record<SkinGoal, string[]> = {
  brightening: ["Niacinamide", "Ascorbic Acid"],
  wrinkle_elasticity: ["Retinol", "Adenosine", "Copper Tripeptide-1"],
  trouble_care: ["Salicylic Acid", "Melaleuca Alternifolia (Tea Tree) Leaf Oil"],
  hydration: ["Hyaluronic Acid", "Panthenol", "Squalane", "Ceramide NP", "Glycerin"],
  pore: ["Salicylic Acid", "Niacinamide"],
};

// PRD 섹션 3 클렌징 행: 계면활성제 종류(아미노산계 vs 설페이트계) 구분
const MILD_SURFACTANTS = ["Sodium Cocoyl Isethionate", "Cocamidopropyl Betaine"];
const HARSH_SURFACTANTS = ["Sodium Lauryl Sulfate", "Sodium Laureth Sulfate"];

// PRD 섹션 9: 임신·수유 중 흔히 주의가 권고되는 성분 — 일반적인 스킨케어 가이드라인 수준의
// 참고 목록이며, 실제 배합 단계에서는 전문가 검증이 필요하다.
const PREGNANCY_CAUTION_INGREDIENTS = ["Retinol", "Salicylic Acid"];

const GOAL_PRIORITY_WEIGHT = [3, 2]; // 1순위, 2순위
const GOAL_SECONDARY_WEIGHT = 1; // 우선순위엔 없지만 관심 목표로 고른 것

export type ScoredProduct = {
  productId: string;
  name: string;
  brand: string | null;
  externalUrl: string;
  imageUrl: string | null;
  country: string;
  retailer: string | null;
  fragranceLevel: "none" | "light" | "strong";
  texture: "light" | "medium" | "rich";
  colorFree: boolean;
  score: number;
  reasons: string[];
};

const FRAGRANCE_LEVEL_KO: Record<"none" | "light" | "strong", string> = {
  none: "무향",
  light: "은은한 향",
  strong: "뚜렷한 향",
};

const TEXTURE_KO: Record<"light" | "medium" | "rich", string> = {
  light: "가벼운 워터/젤",
  medium: "적당한 로션",
  rich: "묵직한 크림",
};

// MVP 기본값은 국내(KR)로 한정한다 (PRD 섹션 4 "권장" 결정). Phase 3부터 countries로 해외 채널을 옵트인.
const DEFAULT_COUNTRIES = ["KR"];

export async function getRecommendations(
  userId: string,
  category: ProductCategory,
  countries: string[] = DEFAULT_COUNTRIES,
): Promise<ScoredProduct[]> {
  const [latestProfile] = await db
    .select({
      goals: skinProfiles.goals,
      goalPriority: skinProfiles.goalPriority,
      diagnosedConditions: skinProfiles.diagnosedConditions,
      pastReactions: skinProfiles.pastReactions,
      pregnancyStatus: skinProfiles.pregnancyStatus,
      fragrancePreference: skinProfiles.fragrancePreference,
      texturePreference: skinProfiles.texturePreference,
      prefersColorFree: skinProfiles.prefersColorFree,
    })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, userId))
    .orderBy(desc(skinProfiles.createdAt))
    .limit(1);

  const goals = (latestProfile?.goals ?? []) as SkinGoal[];
  const goalPriority = (latestProfile?.goalPriority ?? []) as SkinGoal[];
  const isSensitive =
    (latestProfile?.pastReactions?.length ?? 0) > 0 ||
    (latestProfile?.diagnosedConditions ?? []).some((c) =>
      ["atopic_dermatitis", "rosacea"].includes(c),
    );
  const isPregnantOrBreastfeeding =
    latestProfile?.pregnancyStatus === "pregnant" ||
    latestProfile?.pregnancyStatus === "breastfeeding";
  const fragrancePreference = latestProfile?.fragrancePreference ?? null;
  const texturePreference = latestProfile?.texturePreference ?? null;
  const prefersColorFree = latestProfile?.prefersColorFree ?? false;

  const excluded = await db
    .select({ ingredientId: excludedIngredients.ingredientId })
    .from(excludedIngredients)
    .where(eq(excludedIngredients.userId, userId));
  const excludedIds = new Set(excluded.map((e) => e.ingredientId));

  if (isPregnantOrBreastfeeding) {
    const cautionRows = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(inArray(ingredients.inciName, PREGNANCY_CAUTION_INGREDIENTS));
    for (const row of cautionRows) excludedIds.add(row.id);
  }

  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      brand: products.brand,
      externalUrl: products.externalUrl,
      imageUrl: products.imageUrl,
      country: products.country,
      retailer: products.retailer,
      fragranceLevel: products.fragranceLevel,
      texture: products.texture,
      colorFree: products.colorFree,
      inciName: ingredients.inciName,
      koreanName: ingredients.koreanName,
      ingredientId: ingredients.id,
    })
    .from(products)
    .leftJoin(productIngredients, eq(productIngredients.productId, products.id))
    .leftJoin(ingredients, eq(ingredients.id, productIngredients.ingredientId))
    .where(
      and(
        eq(products.category, category),
        inArray(products.country, countries),
      ),
    );

  const byProduct = new Map<
    string,
    {
      name: string;
      brand: string | null;
      externalUrl: string;
      imageUrl: string | null;
      country: string;
      retailer: string | null;
      fragranceLevel: "none" | "light" | "strong";
      texture: "light" | "medium" | "rich";
      colorFree: boolean;
      ingredientIds: Set<string>;
      inciNames: Set<string>;
      koreanNames: Map<string, string | null>;
    }
  >();

  for (const row of rows) {
    if (!byProduct.has(row.productId)) {
      byProduct.set(row.productId, {
        name: row.name,
        brand: row.brand,
        externalUrl: row.externalUrl,
        imageUrl: row.imageUrl,
        country: row.country,
        retailer: row.retailer,
        fragranceLevel: row.fragranceLevel,
        texture: row.texture,
        colorFree: row.colorFree,
        ingredientIds: new Set(),
        inciNames: new Set(),
        koreanNames: new Map(),
      });
    }
    const entry = byProduct.get(row.productId)!;
    if (row.ingredientId) {
      entry.ingredientIds.add(row.ingredientId);
      entry.inciNames.add(row.inciName!);
      entry.koreanNames.set(row.inciName!, row.koreanName);
    }
  }

  const scored: ScoredProduct[] = [];

  for (const [productId, product] of byProduct) {
    // ① 안전성 필터 — 제외 성분이 하나라도 있으면 후보에서 완전히 배제
    const hasExcluded = [...product.ingredientIds].some((id) =>
      excludedIds.has(id),
    );
    if (hasExcluded) continue;

    let score = 0;
    const reasons: string[] = [];

    // ② 목표 적합도 — F의 우선순위 반영
    for (const goal of goals) {
      const rankInPriority = goalPriority.indexOf(goal);
      const weight =
        rankInPriority !== -1
          ? GOAL_PRIORITY_WEIGHT[rankInPriority] ?? GOAL_SECONDARY_WEIGHT
          : GOAL_SECONDARY_WEIGHT;

      const matchedIngredients = GOAL_INGREDIENTS[goal].filter((inci) =>
        product.inciNames.has(inci),
      );
      if (matchedIngredients.length > 0) {
        score += weight * 10;
        const label = product.koreanNames.get(matchedIngredients[0]) ?? matchedIngredients[0];
        reasons.push(`목표(${GOAL_LABELS[goal]})에 맞는 ${label} 함유`);
      }
    }

    // 카테고리별 규칙 (PRD 섹션 3)
    if (category === "cleansing") {
      if (MILD_SURFACTANTS.some((n) => product.inciNames.has(n))) {
        score += 10;
        reasons.push("아미노산계 저자극 세정 성분 사용");
      }
      if (HARSH_SURFACTANTS.some((n) => product.inciNames.has(n))) {
        score -= 10;
        reasons.push("설페이트계 세정 성분 포함 — 자극 가능성");
      }
    }

    if (category === "toner" && isSensitive) {
      if (product.inciNames.has("Alcohol Denat.")) {
        score -= 15;
        reasons.push("민감 피부 프로필 — 알코올 함유로 감점");
      } else {
        score += 5;
        reasons.push("알코올프리");
      }
    }

    // ③ 취향 적합도 — G단계 사용감 선호와 제품 실측 속성 매칭
    if (fragrancePreference) {
      if (product.fragranceLevel === fragrancePreference) {
        score += 8;
        reasons.push(`선호하는 향 강도(${FRAGRANCE_LEVEL_KO[fragrancePreference]})와 일치`);
      } else if (
        (fragrancePreference === "none" && product.fragranceLevel === "strong") ||
        (fragrancePreference === "strong" && product.fragranceLevel === "none")
      ) {
        score -= 8;
        reasons.push("선호하는 향 강도와 정반대");
      }
    }

    if (texturePreference) {
      if (product.texture === texturePreference) {
        score += 5;
        reasons.push(`선호하는 제형(${TEXTURE_KO[texturePreference]})과 일치`);
      } else if (
        (texturePreference === "light" && product.texture === "rich") ||
        (texturePreference === "rich" && product.texture === "light")
      ) {
        score -= 5;
        reasons.push("선호하는 제형과 정반대");
      }
    }

    if (prefersColorFree) {
      if (product.colorFree) {
        score += 5;
        reasons.push("무착색 선호와 일치");
      } else {
        score -= 5;
        reasons.push("착색 성분 포함 — 무착색 선호와 불일치");
      }
    }

    scored.push({
      productId,
      name: product.name,
      brand: product.brand,
      externalUrl: product.externalUrl,
      imageUrl: product.imageUrl,
      country: product.country,
      retailer: product.retailer,
      fragranceLevel: product.fragranceLevel,
      texture: product.texture,
      colorFree: product.colorFree,
      score,
      reasons,
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}

// PRD 섹션 4: MVP는 국내(KR) 한정, Phase 3부터 성분 표기가 비교적 명확한 채널(iHerb 등)의
// 미국(US) 제품을 국가 필터로 옵트인. 새 국가를 열 때마다 여기에 추가한다.
export const AVAILABLE_COUNTRIES: { code: string; label: string }[] = [
  { code: "KR", label: "국내" },
  { code: "US", label: "미국" },
];

export const GOAL_LABELS: Record<SkinGoal, string> = {
  brightening: "미백 · 톤업",
  wrinkle_elasticity: "주름 · 탄력",
  pore: "모공",
  hydration: "수분 · 보습",
  trouble_care: "트러블 개선",
};

export const CATEGORY_ORDER: ProductCategory[] = [
  "cleansing",
  "toner",
  "essence_serum",
  "cream_lotion",
  "sunscreen_spot",
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cleansing: "클렌징",
  toner: "토너",
  essence_serum: "에센스/세럼",
  cream_lotion: "크림/로션",
  sunscreen_spot: "선크림/스팟케어",
};
