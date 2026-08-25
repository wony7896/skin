import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cosingIngredients, ingredientAliases, ingredients } from "@/db/schema";

// EU CosIng의 Restriction 필드는 "III/243", "Annex III/I/262 - Directive 2012/21/EU"처럼
// 로마 숫자 Annex 번호를 담는다. "II"가 "III"의 부분 문자열이라 단순 포함 검사로는 Annex III를
// Annex II로 잘못 집계하므로 반드시 단어 경계(\b)로 앵커링해야 한다.
const EU_ANNEX_II_PATTERN = /\bII\b\s*\//;

// restriction 문자열이 EU Annex II(화장품 전면 금지 성분 목록)를 가리키는지 — 규제 사실
// 그대로를 파싱하는 것이라 판단이 필요 없다.
export function isAnnexIIProhibited(restriction: string | null): boolean {
  return !!restriction && EU_ANNEX_II_PATTERN.test(restriction);
}

// 새 제품의 성분을 product_ingredients에 넣기 전에는 항상 이 함수로 이름을 canonical
// ingredient id로 변환한다 (대소문자 무시 비교 — 라벨 표기 차이로 "Glycerin"과 "glycerin"이
// 서로 다른 행이 되는 것을 막기 위함).
//
// 순서: ① 운영 테이블(public.ingredients) 정확 일치 → ② 별칭 테이블 → ③ 참조 스키마
// (ingredient_ref.cosing_ingredients, EU 공식 CosIng 기반 24,094건)에서 찾아 운영 테이블에
// 새 행으로 그대로 복사(DB→DB 카피, 사람/모델이 값을 옮겨 적지 않음)한 뒤 그 id를 반환.
// 셋 다 없으면 null — 정말 모르는 성분이니 수동 확인이 필요하다는 신호다.
// 참조 스키마 원본은 이름이 전부 대문자(예: "NIACINAMIDE")라, 새로 만들어지는 행도 그대로
// 대문자로 저장된다 — 보기엔 아쉽지만, 표기를 억지로 다듬다가 "PEG-40" 같은 대문자 약어
// 표기를 깨뜨리는 것보다는 원본 그대로 두는 쪽이 안전하다.
export async function resolveIngredientId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const [exact] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(sql`lower(${ingredients.inciName}) = ${lower}`)
    .limit(1);
  if (exact) return exact.id;

  const [aliased] = await db
    .select({ id: ingredientAliases.ingredientId })
    .from(ingredientAliases)
    .where(sql`lower(${ingredientAliases.alias}) = ${lower}`)
    .limit(1);
  if (aliased) return aliased.id;

  const [fromRef] = await db
    .select({
      inciName: cosingIngredients.inciName,
      casNo: cosingIngredients.casNo,
      restriction: cosingIngredients.restriction,
    })
    .from(cosingIngredients)
    .where(sql`lower(${cosingIngredients.inciName}) = ${lower}`)
    .limit(1);
  if (!fromRef) return null;

  const [created] = await db
    .insert(ingredients)
    .values({
      inciName: fromRef.inciName,
      casNumber: fromRef.casNo,
      restriction: fromRef.restriction,
      isEuProhibited: isAnnexIIProhibited(fromRef.restriction),
    })
    .onConflictDoNothing({ target: ingredients.inciName })
    .returning({ id: ingredients.id });
  if (created) return created.id;

  // 동시성 등으로 방금 다른 요청이 먼저 만들었을 수 있으니 한 번 더 조회
  const [raceWinner] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.inciName, fromRef.inciName))
    .limit(1);
  return raceWinner?.id ?? null;
}
