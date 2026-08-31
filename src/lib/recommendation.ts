import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  excludedIngredients,
  ingredients,
  productIngredients,
  products,
  recommendations,
  skinProfiles,
  usageFeedback,
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
//
// 값은 목표 대비 상대 기여도. 글리세린처럼 거의 모든 스킨케어에 들어가는 범용 보습제는
// 있다는 사실만으로는 제품 간 변별력이 없어 낮게 잡고(0.25), 목표를 실제로 대표하는
// 액티브(히알루론산·세라마이드 등)는 1로 둔다.
const GOAL_INGREDIENTS: Record<SkinGoal, Record<string, number>> = {
  brightening: { Niacinamide: 1, "Ascorbic Acid": 1 },
  wrinkle_elasticity: { Retinol: 1, Adenosine: 1, "Copper Tripeptide-1": 1 },
  trouble_care: {
    "Salicylic Acid": 1,
    "Melaleuca Alternifolia (Tea Tree) Leaf Oil": 0.7,
  },
  hydration: {
    "Hyaluronic Acid": 1,
    "Ceramide NP": 1,
    Panthenol: 0.8,
    Squalane: 0.8,
    Glycerin: 0.25,
  },
  pore: { "Salicylic Acid": 1, Niacinamide: 0.8 },
};

// PRD 섹션 3 클렌징 행: 계면활성제 종류(아미노산계 vs 설페이트계) 구분
const MILD_SURFACTANTS = ["Sodium Cocoyl Isethionate", "Cocamidopropyl Betaine"];
const HARSH_SURFACTANTS = ["Sodium Lauryl Sulfate", "Sodium Laureth Sulfate"];

// PRD 섹션 9: 임신·수유 중 흔히 주의가 권고되는 성분 — 일반적인 스킨케어 가이드라인 수준의
// 참고 목록이며, 실제 배합 단계에서는 전문가 검증이 필요하다.
const PREGNANCY_CAUTION_INGREDIENTS = ["Retinol", "Salicylic Acid"];

// 승인된 보존제(isApprovedPreservative=true) 중에서도 실제로 EU가 별도 조치를 취한 특정
// 성분만 담는다 — "논란이 있다"는 인상만으로 넣지 않고, 확인 가능한 규제 사실이 있는 것만.
// 메틸이소치아졸리논(MIT): SCCS 자극성 평가(2013-12-12) 이후 EU가 리브온 제품에서 전면
// 금지(Regulation 공포 2016-07-23, 시행 2017-02-12) — 워시오프 제품에는 제한된 농도로 계속
// 허용. 출처: SCCS opinion, Commission Regulation 시행 공지(CosmeticOBS 등 복수 소스로 교차
// 확인). 다른 보존제(포름알데히드 방출체 등)는 아직 이 정도로 명확한 단일 조치를 확인하지
// 못해 넣지 않았다.
const CONTROVERSIAL_PRESERVATIVES = ["Methylisothiazolinone"];

// EU가 리브온 제품에서 특정 성분을 전면 금지했을 때, 그 판단을 그대로 반영할 카테고리 —
// 클렌징(워시오프)은 제외한다. 우리 사이트는 한국 시장 대상이라 "불법"은 아니지만, 성분
// 안전성 판단 기준으로 EU 리브온 금지 사실 자체는 그대로 참고할 만하다.
const LEAVE_ON_CATEGORIES: ProductCategory[] = [
  "toner",
  "essence_serum",
  "cream_lotion",
  "sunscreen_spot",
];

const GOAL_PRIORITY_WEIGHT = [3, 2]; // 1순위, 2순위
const GOAL_SECONDARY_WEIGHT = 1; // 우선순위엔 없지만 관심 목표로 고른 것

// 전성분표 표기 순서는 법적으로 함량 내림차순이라, 표기 위치(순번/전체 개수)로 대략적인
// 함량 구간을 추정한다. 같은 액티브라도 1번째로 적힌 제품과 트레이스량으로 마지막 즈음
// 적힌 제품은 실제 효과 기대치가 다르므로 목표 적합도 점수에 반영한다.
function concentrationMultiplier(position: number, total: number): number {
  if (total <= 0) return 1;
  const ratio = position / total;
  if (ratio <= 0.3) return 1;
  if (ratio <= 0.6) return 0.6;
  return 0.3;
}

function concentrationNote(multiplier: number): string {
  if (multiplier === 1) return "";
  if (multiplier === 0.6) return " (중간 함량 추정)";
  return " (트레이스 함량 추정)";
}

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
  skinProfileId?: string,
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
    // skinProfileId를 주면 그 스냅샷 기준으로, 안 주면 최신 스냅샷 기준으로 채점
    .where(
      skinProfileId
        ? eq(skinProfiles.id, skinProfileId)
        : eq(skinProfiles.userId, userId),
    )
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

  // 이 사용자가 이전 추천 제품에 남긴 사용 피드백을 제품별로 모은다. 추천 로그는 진단
  // 스냅샷 시점에 고정되므로, 이 조정은 "다음 진단 스냅샷(체크인)"부터 반영된다.
  const feedbackRows = await db
    .select({
      productId: recommendations.productId,
      satisfactionScore: usageFeedback.satisfactionScore,
      hadTrouble: usageFeedback.hadTrouble,
      repurchaseIntent: usageFeedback.repurchaseIntent,
    })
    .from(usageFeedback)
    .innerJoin(
      recommendations,
      eq(recommendations.id, usageFeedback.recommendationId),
    )
    .where(eq(usageFeedback.userId, userId));

  const feedbackByProduct = new Map<
    string,
    {
      satisfactionSum: number;
      satisfactionCount: number;
      anyTrouble: boolean;
      repurchaseYes: number;
      repurchaseNo: number;
    }
  >();
  for (const f of feedbackRows) {
    const s = feedbackByProduct.get(f.productId) ?? {
      satisfactionSum: 0,
      satisfactionCount: 0,
      anyTrouble: false,
      repurchaseYes: 0,
      repurchaseNo: 0,
    };
    if (f.satisfactionScore != null) {
      s.satisfactionSum += f.satisfactionScore;
      s.satisfactionCount += 1;
    }
    if (f.hadTrouble) s.anyTrouble = true;
    if (f.repurchaseIntent === true) s.repurchaseYes += 1;
    if (f.repurchaseIntent === false) s.repurchaseNo += 1;
    feedbackByProduct.set(f.productId, s);
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
      position: productIngredients.position,
      isEuProhibited: ingredients.isEuProhibited,
      isRestrictedFragrance: ingredients.isRestrictedFragrance,
      isKnownFragranceAllergen: ingredients.isKnownFragranceAllergen,
      isUvFilter: ingredients.isUvFilter,
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
      positions: Map<string, number>;
      totalIngredients: number;
      hasEuProhibitedIngredient: boolean;
      restrictedFragranceNames: Set<string>;
      knownAllergenNames: Set<string>;
      hasUvFilterIngredient: boolean;
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
        positions: new Map(),
        totalIngredients: 0,
        hasEuProhibitedIngredient: false,
        restrictedFragranceNames: new Set(),
        knownAllergenNames: new Set(),
        hasUvFilterIngredient: false,
      });
    }
    const entry = byProduct.get(row.productId)!;
    if (row.ingredientId) {
      entry.ingredientIds.add(row.ingredientId);
      entry.inciNames.add(row.inciName!);
      entry.koreanNames.set(row.inciName!, row.koreanName);
      entry.positions.set(row.inciName!, row.position!);
      entry.totalIngredients += 1;
      if (row.isEuProhibited) entry.hasEuProhibitedIngredient = true;
      if (row.isRestrictedFragrance) entry.restrictedFragranceNames.add(row.inciName!);
      if (row.isKnownFragranceAllergen) entry.knownAllergenNames.add(row.inciName!);
      if (row.isUvFilter) entry.hasUvFilterIngredient = true;
    }
  }

  const scored: ScoredProduct[] = [];

  for (const [productId, product] of byProduct) {
    // ① 안전성 필터 — 사용자 개인 제외 성분이거나, EU Annex II(전면 금지 성분)가 하나라도
    // 있으면 후보에서 완전히 배제. 후자는 개인 제외 목록과 무관하게 모든 사용자에게 적용되는
    // 객관적 규제 사실이다 (src/lib/ingredients.ts의 isAnnexIIProhibited).
    const hasExcluded = [...product.ingredientIds].some((id) =>
      excludedIds.has(id),
    );
    if (hasExcluded || product.hasEuProhibitedIngredient) continue;

    let score = 0;
    const reasons: string[] = [];

    // ② 목표 적합도 — F의 우선순위 반영
    for (const goal of goals) {
      const rankInPriority = goalPriority.indexOf(goal);
      const weight =
        rankInPriority !== -1
          ? GOAL_PRIORITY_WEIGHT[rankInPriority] ?? GOAL_SECONDARY_WEIGHT
          : GOAL_SECONDARY_WEIGHT;

      const potencyByInci = GOAL_INGREDIENTS[goal];
      const matchedIngredients = Object.keys(potencyByInci).filter((inci) =>
        product.inciNames.has(inci),
      );
      if (matchedIngredients.length > 0) {
        // 매칭된 액티브 중 "기여도 × 함량 추정"이 가장 높은 성분을 대표로 채택.
        // (표기 순서가 앞설수록 함량이 높다고 보고, 범용 보습제는 기여도로 눌러준다.)
        const effect = (inci: string) => {
          const pos = product.positions.get(inci) ?? product.totalIngredients;
          return (
            potencyByInci[inci] *
            concentrationMultiplier(pos, product.totalIngredients)
          );
        };
        const bestInci = matchedIngredients.reduce((best, cur) =>
          effect(cur) > effect(best) ? cur : best,
        );
        const position = product.positions.get(bestInci) ?? product.totalIngredients;
        const multiplier = concentrationMultiplier(position, product.totalIngredients);
        score += weight * 10 * multiplier * potencyByInci[bestInci];
        const label = product.koreanNames.get(bestInci) ?? bestInci;
        reasons.push(
          `목표(${GOAL_LABELS[goal]})에 맞는 ${label} 함유${concentrationNote(multiplier)}`,
        );
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

    // 민감 피부 프로필 + 향료 관련 감점 — 카테고리 무관 공통 규칙. 정확한 알레르겐(Annex III
    // entry 45·67-92, 2005년부터 개별표기 의무 대상)이 있으면 더 강하게, 없고 더 넓은 범위의
    // "EU 사용 제한 향료 원료"만 있으면 그보다 약하게 감점한다. knownAllergenNames는
    // restrictedFragranceNames의 부분집합이라 같은 성분을 이중으로 감점하지 않는다.
    if (isSensitive && product.knownAllergenNames.size > 0) {
      const first = [...product.knownAllergenNames][0];
      const label = product.koreanNames.get(first) ?? first;
      score -= 15;
      reasons.push(`민감 피부 프로필 — EU 지정 향료 알레르겐(${label}) 포함`);
    } else if (isSensitive && product.restrictedFragranceNames.size > 0) {
      const first = [...product.restrictedFragranceNames][0];
      const label = product.koreanNames.get(first) ?? first;
      score -= 10;
      reasons.push(`민감 피부 프로필 — EU 사용 제한 향료 성분(${label}) 포함`);
    }

    // 자외선차단 성분 확인 — 하드 배제가 아니라 감점 신호다. 성분표가 3~4개로 얕게 입력된
    // 경우가 많아, 실제로는 자외선차단 성분이 있는데 아직 DB에 안 들어갔을 수도 있기 때문.
    if (category === "sunscreen_spot" && !product.hasUvFilterIngredient) {
      score -= 15;
      reasons.push("자외선차단 성분 확인 안 됨 — 전성분 정보 확인 필요");
    }

    // 민감 피부 프로필 + 특정 논란 보존제 — EU가 실제로 조치를 취한 성분만 담은
    // CONTROVERSIAL_PRESERVATIVES 참고. 리브온 카테고리는 EU가 2017년부터 전면 금지한
    // 사실을 그대로 반영해 더 강하게, 워시오프(클렌징)는 여전히 제한된 농도로는 합법이라 더
    // 약하게 감점한다.
    const controversialPreservative = CONTROVERSIAL_PRESERVATIVES.find((n) =>
      product.inciNames.has(n),
    );
    if (isSensitive && controversialPreservative) {
      const label = product.koreanNames.get(controversialPreservative) ?? controversialPreservative;
      if (LEAVE_ON_CATEGORIES.includes(category)) {
        score -= 20;
        reasons.push(`민감 피부 프로필 — 리브온 제품 EU 사용금지 보존제(${label}) 포함`);
      } else {
        score -= 8;
        reasons.push(`민감 피부 프로필 — 알레르기 논란 보존제(${label}) 포함`);
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

    // ④ 이전 사용 피드백 반영 — 같은 제품을 실제로 써 본 결과가 있으면 다음 추천에 가감점.
    const feedback = feedbackByProduct.get(productId);
    if (feedback) {
      if (feedback.anyTrouble) {
        score -= 25;
        reasons.push("이전 사용에서 트러블 보고 — 감점");
      }
      if (feedback.satisfactionCount > 0) {
        const avg = feedback.satisfactionSum / feedback.satisfactionCount;
        if (avg >= 4) {
          score += 10;
          reasons.push(`이전 사용 만족도 높음 (${avg.toFixed(1)}/5)`);
        } else if (avg <= 2) {
          score -= 12;
          reasons.push(`이전 사용 만족도 낮음 (${avg.toFixed(1)}/5)`);
        }
      }
      if (feedback.repurchaseYes > feedback.repurchaseNo) {
        score += 5;
        reasons.push("재구매 의사 있음");
      } else if (feedback.repurchaseNo > feedback.repurchaseYes) {
        score -= 5;
        reasons.push("재구매 의사 없음");
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

// 진단 스냅샷 1건에 대한 추천 로그를 딱 한 번 생성한다. 스냅샷은 불변이므로
// 이미 만들어져 있으면 아무것도 하지 않는다 — 온보딩·체크인 제출 시 호출되고,
// 누락됐을 때를 대비해 /recommendations 렌더에서도 방어적으로 한 번 더 호출한다.
export async function generateRecommendationsForProfile(
  userId: string,
  skinProfileId: string,
  countries: string[] = DEFAULT_COUNTRIES,
): Promise<void> {
  const [existing] = await db
    .select({ id: recommendations.id })
    .from(recommendations)
    .where(eq(recommendations.skinProfileId, skinProfileId))
    .limit(1);
  if (existing) return;

  const rows: (typeof recommendations.$inferInsert)[] = [];
  for (const category of CATEGORY_ORDER) {
    const scored = await getRecommendations(
      userId,
      category,
      countries,
      skinProfileId,
    );
    for (const product of scored.slice(0, 3)) {
      rows.push({
        userId,
        skinProfileId,
        productId: product.productId,
        category,
        safetyPassed: true,
        goalFitScore: product.score.toString(),
        reason: product.reasons.join(" · ") || "제외 성분 없음",
      });
    }
  }

  if (rows.length > 0) {
    await db.insert(recommendations).values(rows);
  }
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
