import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// INCI 화장품 성분사전 — 목표 매칭·자극 성분 분류용으로 손으로 큐레이션한 행 +
// ingredient_ref.cosing_ingredients(EU 공식 CosIng)에서 실제 제품에 쓰일 때마다
// resolveIngredientId()가 자동으로 복사해오는 행이 함께 있다 (src/lib/ingredients.ts).
export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  inciName: text("inci_name").notNull().unique(),
  koreanName: text("korean_name"),
  casNumber: text("cas_number"),
  // EU CosIng의 Restriction 필드 원문(예: "III/243") — 참조 스키마에서 그대로 복사.
  restriction: text("restriction"),
  // restriction이 Annex II(전면 금지 성분) 항목을 가리키는지 — 객관적 규제 사실이라 판단이
  // 필요 없다. true면 사용자의 개인 제외 목록과 무관하게 추천에서 항상 배제한다.
  isEuProhibited: boolean("is_eu_prohibited").notNull().default(false),
  // EU CosIng Function이 "PERFUMING"을 포함하면서 동시에 restriction이 Annex III(사용 제한·
  // 경고표시 대상) 항목인지 — "EU에서 사용 제한이 걸린 향료 원료"라는 객관적 규제 신호.
  // 라벨에 개별 표기가 법적으로 의무인 향료 알레르겐 82종의 정확한 목록과는 다르며, 그보다
  // 넓은 "제한 대상 향료 원료" 집합이다 (섹션: src/lib/ingredients.ts 주석 참고).
  isRestrictedFragrance: boolean("is_restricted_fragrance")
    .notNull()
    .default(false),
  // restriction이 Annex III의 향료 알레르겐 개별표기 의무 항목(entry 45, 67~92 — 2005년부터
  // 시행된 "고전 24종" 목록)을 정확히 가리키는지. EU 공식 CosIng 데이터에 이미 담긴 entry
  // 번호를 그대로 읽는 것이라 판단이 필요 없다. 단, 이 사전 자체가 2016년 스냅샷이라 2023년
  // 개정으로 추가된 56종은 반영돼 있지 않다 — isRestrictedFragrance(더 넓은 집합)로만 잡힌다.
  isKnownFragranceAllergen: boolean("is_known_fragrance_allergen")
    .notNull()
    .default(false),
  // CosIng Function이 "UV FILTER" 또는 "UV ABSORBER"를 포함하는지. Annex VI(자외선차단
  // 성분 승인 목록) 번호가 아니라 Function 태그로 판정한다 — 예를 들어 Zinc Oxide는 실제
  // EU Annex VI 승인이 2016-05(Regulation (EU) 2016/621)에 발효돼 우리 2016-02 스냅샷엔
  // Annex VI 번호가 안 붙어 있지만, Function은 "UV ABSORBER"로 이미 정확히 태그돼 있다.
  isUvFilter: boolean("is_uv_filter").notNull().default(false),
  // CosIng Function이 "PRESERVATIVE"를 포함하는지 — UV FILTER와 같은 이유로 Annex V(보존제
  // 승인 목록) restriction 번호가 아니라 Function 태그로 판정한다. Annex V 항목 148개는
  // restriction에도 "V/xx"가 붙어 있지만, 25개는 승인 시점이 2016년 스냅샷보다 늦어 번호가
  // 안 붙어 있으면서도 Function은 이미 정확하다 — UV FILTER의 Zinc Oxide와 같은 패턴.
  isApprovedPreservative: boolean("is_approved_preservative")
    .notNull()
    .default(false),
  // 성분별 자극 유발 빈도 태그 (누적 보고 데이터로 갱신)
  irritantReportCount: integer("irritant_report_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 성분 별칭 — 지역별 라벨링 관행 차이(예: 미국 라벨 "Fragrance" ↔ INCI "Parfum")나 흔히 쓰는
// 관용명(예: "Vitamin C" ↔ "Ascorbic Acid")을 canonical ingredient 행으로 묶어준다.
// 신규 제품의 성분을 DB에 넣을 때는 항상 이 테이블을 먼저 거쳐(inciName 정확 일치 → 이 별칭
// 일치 순서로) 같은 물질이 서로 다른 ingredients 행으로 중복 생성되지 않도록 한다.
export const ingredientAliases = pgTable("ingredient_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  alias: text("alias").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 복용/도포 약물 참조 DB — 화장품 ingredients와 별도 소스 (식약처 의약품표준코드 기반, PRD 섹션 1-B)
export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  standardCode: text("standard_code").unique(),
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
