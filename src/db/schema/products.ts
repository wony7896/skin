import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { fragranceLevelEnum, productCategoryEnum, textureEnum } from "./enums";
import { ingredients } from "./ingredients";

// 국내 커머스(쿠팡·올리브영·무신사뷰티 등) + Phase 3부터 해외 채널(아마존·iHerb·YesStyle 등) 제품 (PRD 섹션 4, 8)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: productCategoryEnum("category").notNull(),
  retailer: text("retailer"),
  // ISO 3166-1 alpha-2 국가 코드 (예: KR, US). 기존 국내 제품은 마이그레이션에서 'KR'로 채움
  country: text("country").notNull().default("KR"),
  externalUrl: text("external_url").notNull(),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  // 취향 매칭용 실제 제품 속성 (PRD 섹션 1-F 취향 문항과 짝을 이룸)
  fragranceLevel: fragranceLevelEnum("fragrance_level").notNull().default("light"),
  texture: textureEnum("texture").notNull().default("medium"),
  colorFree: boolean("color_free").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productIngredients = pgTable("product_ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  // 전성분표(INCI) 표기 순서 — 함량 내림차순 근사치
  position: integer("position").notNull(),
});
