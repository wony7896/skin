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

// PRD 섹션 9: 배합 결정에 직접 영향을 주는 임신·수유 여부 (레티놀·살리실산 등 금기/주의 성분 필터링에 사용)
export const pregnancyStatusEnum = pgEnum("pregnancy_status", [
  "none",
  "pregnant",
  "breastfeeding",
]);

// 취향(향·제형) — 제품의 실제 속성과 사용자의 선호를 같은 값 집합으로 매칭한다.
// 사용자 쪽 컬럼은 nullable로 두고 null = "무관"으로 취급한다.
export const fragranceLevelEnum = pgEnum("fragrance_level", [
  "none",
  "light",
  "strong",
]);

export const textureEnum = pgEnum("texture", ["light", "medium", "rich"]);
