import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "./auth";
import {
  fragranceLevelEnum,
  ingredientStatusEnum,
  inputMethodEnum,
  pregnancyStatusEnum,
  profileSourceEnum,
  reportSourceEnum,
  skinGoalEnum,
  textureEnum,
} from "./enums";
import { ingredients, medications } from "./ingredients";
import { products } from "./products";

// E. 현재 루틴 — 카테고리별 사용 중 제품 (제품 검색/매칭 파이프라인 도입 전까지는 자유 입력)
export type RoutineProductEntry = {
  category: string;
  productName: string;
  frequency: string;
};

// C. 과거 반응 이력 — 제품 단위(성분 역추적 파이프라인 도입 전까지는 자유 입력) + 반응 유형·강도·패치테스트
// 여부를 하나의 사건으로 묶어 구조화한다. severity>=4 또는 두드러기 포함 시 피부과 상담 권유 분기의 트리거로 쓴다.
export type PastReactionEntry = {
  productName: string;
  reactionTypes: string[];
  severity: number;
  wasPatchTested: boolean;
};

// 진단마다 생성되는 스냅샷(버전이 있는 시계열) — 이전 스냅샷과 비교해 변화량 계산 (PRD 섹션 2)
export const skinProfiles = pgTable("skin_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  source: profileSourceEnum("source").notNull(),

  // A. 기본 피부 특성
  tightnessMinutes: numeric("tightness_minutes"),
  tZoneShineMinutes: numeric("t_zone_shine_minutes"),
  poreSize: text("pore_size"),
  oilinessVisual: text("oiliness_visual"),

  // 유분/건성 슬라이더 — 체크인에서 매회 갱신 (0~100)
  oilyDryScore: smallint("oily_dry_score"),

  // B. 피부 질환 병력 (약물은 별도 user_medications 테이블)
  diagnosedConditions: text("diagnosed_conditions").array(),
  recentProcedures: text("recent_procedures"),

  // C. 알레르기·트러블 유발 성분
  pastReactions: jsonb("past_reactions").$type<PastReactionEntry[]>(),
  hadPatchTest: boolean("had_patch_test"),
  atopicFamilyHistory: boolean("atopic_family_history"),
  // 임신·수유 여부 — 레티놀·살리실산 등 배합 금기/주의 성분 필터링에 사용 (PRD 섹션 9)
  pregnancyStatus: pregnancyStatusEnum("pregnancy_status"),

  // D. 생활·환경 요인
  humidityRegion: text("humidity_region"),
  uvExposureHours: numeric("uv_exposure_hours"),
  maskHours: numeric("mask_hours"),
  sleepHours: numeric("sleep_hours"),
  stressLevel: smallint("stress_level"),
  isSmoker: boolean("is_smoker"),

  // E. 현재 루틴
  currentRoutineProducts: jsonb(
    "current_routine_products",
  ).$type<RoutineProductEntry[]>(),
  lastNewProductAt: timestamp("last_new_product_at", { withTimezone: true }),

  // F. 스킨케어 목표 — 다중선택 + 우선순위(배열 앞쪽일수록 우선)
  goals: skinGoalEnum("goals").array(),
  goalPriority: skinGoalEnum("goal_priority").array(),

  // G. 사용감 취향 — null은 "무관"으로 취급. products의 동일 축과 매칭해 추천 점수에 반영
  fragrancePreference: fragranceLevelEnum("fragrance_preference"),
  texturePreference: textureEnum("texture_preference"),
  prefersColorFree: boolean("prefers_color_free"),

  // 체크인 전용 필드 (섹션 1-②) — 온보딩의 BSTI 점수보다 가벼운 슬라이더 3종
  troubleAreas: text("trouble_areas").array(),
  photoUrl: text("photo_url"),
  rednessLevel: smallint("redness_level"),
  flakingLevel: smallint("flaking_level"),
  recentRecommendationSatisfaction: smallint(
    "recent_recommendation_satisfaction",
  ),
  menstrualCycleChange: text("menstrual_cycle_change"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 확정/의심 단계가 있는 성분 제외 리스트. 반복 보고될수록 확정 신뢰도 상승 (PRD 섹션 2)
export const excludedIngredients = pgTable(
  "excluded_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "restrict" }),
    status: ingredientStatusEnum("status").notNull().default("suspected"),
    source: reportSourceEnum("source").notNull(),
    reportCount: integer("report_count").notNull().default(1),
    firstReportedAt: timestamp("first_reported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReportedAt: timestamp("last_reported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // 사용자당 성분 하나에 한 행만 존재 — 재보고 시 report_count를 올리는 upsert 대상
    unique().on(table.userId, table.ingredientId),
  ],
);

// B파트 복용/도포 약물 입력 — 사진/바코드로 medications를 매칭한 기록
export const userMedications = pgTable("user_medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  skinProfileId: uuid("skin_profile_id")
    .notNull()
    .references(() => skinProfiles.id, { onDelete: "cascade" }),
  medicationId: uuid("medication_id").references(() => medications.id, {
    onDelete: "set null",
  }),
  // 인식 실패 시 폴백으로 남는 사용자 직접 입력값
  freeTextName: text("free_text_name"),
  inputMethod: inputMethodEnum("input_method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 이벤트 트리거 반응 리포트 — 원본 사건 기록 (excludedIngredients는 이로부터 집계) (PRD 섹션 1-③)
export const troubleReports = pgTable("trouble_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  onsetDays: integer("onset_days"),
  bodyArea: text("body_area"),
  severity: smallint("severity").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
