import {
  boolean,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "./auth";
import { productCategoryEnum } from "./enums";
import { products } from "./products";
import { skinProfiles } from "./profiles";

// 사용자·카테고리·시점별 추천 로그 (PRD 섹션 2, 섹션 3 2단 스코어링)
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  skinProfileId: uuid("skin_profile_id")
    .notNull()
    .references(() => skinProfiles.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  category: productCategoryEnum("category").notNull(),
  // ① 안전성 필터 게이트 통과 여부 — false면 목표 적합도와 무관하게 후보에서 배제
  safetyPassed: boolean("safety_passed").notNull(),
  // ② 목표 적합도 점수 (섹션 1-F 우선순위 매칭)
  goalFitScore: numeric("goal_fit_score"),
  reason: text("reason"),
  recommendedAt: timestamp("recommended_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 추천 제품 사용 후 결과 (만족도, 트러블 여부, 재구매 의사) (PRD 섹션 2)
export const usageFeedback = pgTable("usage_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  recommendationId: uuid("recommendation_id")
    .notNull()
    .references(() => recommendations.id, { onDelete: "cascade" }),
  satisfactionScore: smallint("satisfaction_score"),
  hadTrouble: boolean("had_trouble"),
  repurchaseIntent: boolean("repurchase_intent"),
  feedbackText: text("feedback_text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
