import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { productCategoryEnum } from "./enums";
import { ingredients } from "./ingredients";

// 국내 커머스(쿠팡·올리브영·무신사뷰티 등)에서 수집한 제품 (PRD 섹션 4 MVP 범위)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: productCategoryEnum("category").notNull(),
  retailer: text("retailer"),
  externalUrl: text("external_url").notNull(),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
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
