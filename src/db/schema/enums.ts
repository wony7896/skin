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

// PRD 섹션 6: 일반 이용약관과 별도로 받아야 하는 동의 항목들
export const consentTypeEnum = pgEnum("consent_type", [
  "sensitive_health_info", // 피부질환 이력·복용 약물·알레르기 정보
  "biometric_photo", // 얼굴 클로즈업 사진 기반 분석
]);
