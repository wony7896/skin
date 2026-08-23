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
