import { pgSchema, serial, text, timestamp } from "drizzle-orm/pg-core";

// public 스키마와 물리적으로 같은 DB지만 논리적으로 완전히 분리된 참조 전용 스키마.
// 화장품 성분 수만 건짜리 대량 참조 데이터는 여기에만 두고, 운영 테이블(public.ingredients)은
// 실제로 제품에 쓰인 성분 + 목표 매칭용 큐레이션 성분만 유지한다 (resolveIngredientId 참고).
export const ingredientRefSchema = pgSchema("ingredient_ref");

// EU 집행위 공식 CosIng "Ingredients/Fragrance Inventory" 원본 CSV(Open Beauty Facts 저장소
// 미러: openfoodfacts/openbeautyfacts, cosing/COSING_Ingredients-Fragrance.Inventory_v2.csv)를
// COPY로 그대로 적재한 것 — 값을 사람/모델이 옮겨 적지 않아 표기·기억 오류가 섞이지 않는다.
// 2016-02-15 스냅샷이라 이후 추가/개정된 성분은 반영되어 있지 않을 수 있다.
// Function 필드는 원본이 "HUMECTANT, SKIN CONDITIONING"처럼 콤마로 여러 개를 나열해서,
// 적재 후 SQL로 기계적으로 배열(functions)로 분해해둔다 — 판단이 들어가는 가공이 아니라
// 순수 문자열 분리이므로 오류 위험이 없다.
export const cosingIngredients = ingredientRefSchema.table("cosing_ingredients", {
  id: serial("id").primaryKey(),
  cosingRefNo: text("cosing_ref_no"),
  inciName: text("inci_name").notNull(),
  innName: text("inn_name"),
  phEurName: text("ph_eur_name"),
  casNo: text("cas_no"),
  einecsNo: text("einecs_no"),
  description: text("description"),
  restriction: text("restriction"),
  functionRaw: text("function_raw"),
  functions: text("functions").array(),
  updateDate: text("update_date"),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
