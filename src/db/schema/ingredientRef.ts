import { integer, pgSchema, serial, text, timestamp } from "drizzle-orm/pg-core";

// public 스키마와 물리적으로 같은 DB지만 논리적으로 완전히 분리된 참조 전용 스키마.
// 화장품 성분 수만 건짜리 대량 참조 데이터는 여기에만 두고, 운영 테이블(public.ingredients)은
// 실제로 제품에 쓰인 성분 + 목표 매칭용 큐레이션 성분만 유지한다 (resolveIngredientId 참고).
export const ingredientRefSchema = pgSchema("ingredient_ref");

// EU 집행위 CosIng(화장품 성분 공식 DB)을 INCI/CAS/EC/PubChem 필드로 재정리해 MIT 라이선스로
// 배포한 데이터셋(https://github.com/beauteeru/cosmetic-ingredients-dataset)을 COPY로 그대로
// 적재한 것 — 필드값을 사람이나 모델이 손으로 옮겨 적지 않아, 표기 오류·기억 오류가 섞이지 않는다.
// 한글명·기능분류(보습제/방부제 등)는 원본에 없어 비어 있다.
export const cosingIngredients = ingredientRefSchema.table("cosing_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  substanceId: text("substance_id"),
  casNo: text("cas_no"),
  ecNo: text("ec_no"),
  pubchemCid: integer("pubchem_cid"),
  pubchemUrl: text("pubchem_url"),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
