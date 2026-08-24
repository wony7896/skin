import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ingredientAliases, ingredients } from "@/db/schema";

// 새 제품의 성분을 ingredients/product_ingredients에 넣기 전에는 항상 이 함수로 이름을
// canonical ingredient id로 변환한다. inciName 정확 일치를 먼저 보고, 없으면 별칭 테이블을
// 본다 — 같은 물질(예: "Fragrance"/"Parfum")이 라벨 표기 차이만으로 서로 다른 ingredients
// 행이 되어 안전 제외/목표 매칭이 조용히 실패하는 것을 막기 위함이다.
export async function resolveIngredientId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const [exact] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.inciName, trimmed))
    .limit(1);
  if (exact) return exact.id;

  const [aliased] = await db
    .select({ id: ingredientAliases.ingredientId })
    .from(ingredientAliases)
    .where(eq(ingredientAliases.alias, trimmed))
    .limit(1);
  return aliased?.id ?? null;
}
