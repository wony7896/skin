import { pgEnum } from "drizzle-orm/pg-core";

export const profileSourceEnum = pgEnum("profile_source", [
  "onboarding",
  "checkin",
]);

export const ingredientStatusEnum = pgEnum("ingredient_status", [
  "suspected",
  "confirmed",
]);

export const reportSourceEnum = pgEnum("report_source", [
  "onboarding",
  "checkin",
  "event_report",
]);

export const inputMethodEnum = pgEnum("input_method", [
  "photo",
  "barcode",
  "search",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "cleansing",
  "toner",
  "essence_serum",
  "cream_lotion",
  "sunscreen_spot",
]);

export const skinGoalEnum = pgEnum("skin_goal", [
  "brightening",
  "wrinkle_elasticity",
  "pore",
  "hydration",
  "trouble_care",
]);
