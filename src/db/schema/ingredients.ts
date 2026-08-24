import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// INCI 화장품 성분사전 — 식약처 성분사전 등 공개 DB 기반 (PRD 섹션 2)
export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  inciName: text("inci_name").notNull().unique(),
  koreanName: text("korean_name"),
  casNumber: text("cas_number"),
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
