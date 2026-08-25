import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cosingIngredients, ingredientAliases, ingredients } from "@/db/schema";

// 새 제품의 성분을 product_ingredients에 넣기 전에는 항상 이 함수로 이름을 canonical
// ingredient id로 변환한다 (대소문자 무시 비교 — 라벨 표기 차이로 "Glycerin"과 "glycerin"이
// 서로 다른 행이 되는 것을 막기 위함).
//
// 순서: ① 운영 테이블(public.ingredients) 정확 일치 → ② 별칭 테이블 → ③ 참조 스키마
// (ingredient_ref.cosing_ingredients, EU CosIng 기반 28,354건)에서 찾아 운영 테이블에
// 새 행으로 그대로 복사(DB→DB 카피, 사람/모델이 값을 옮겨 적지 않음)한 뒤 그 id를 반환.
// 셋 다 없으면 null — 정말 모르는 성분이니 수동 확인이 필요하다는 신호다.
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
      name: cosingIngredients.name,
      casNo: cosingIngredients.casNo,
    })
    .from(cosingIngredients)
    .where(sql`lower(${cosingIngredients.name}) = ${lower}`)
    .limit(1);
  if (!fromRef) return null;

  const [created] = await db
    .insert(ingredients)
    .values({ inciName: fromRef.name, casNumber: fromRef.casNo })
    .onConflictDoNothing({ target: ingredients.inciName })
    .returning({ id: ingredients.id });
  if (created) return created.id;

  // 동시성 등으로 방금 다른 요청이 먼저 만들었을 수 있으니 한 번 더 조회
  const [raceWinner] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.inciName, fromRef.name))
    .limit(1);
  return raceWinner?.id ?? null;
}
