import {
  boolean,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "./auth";
import {
  ingredientStatusEnum,
  inputMethodEnum,
  profileSourceEnum,
  reportSourceEnum,
  skinGoalEnum,
} from "./enums";
import { ingredients, medications } from "./ingredients";
import { products } from "./products";

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

  // BSTI 4축 (유분/건성 · 민감/저항성 · 색소침착 경향 · 탄력/주름) — 0~100 점수
  oilyDryScore: smallint("oily_dry_score"),
  sensitiveResistantScore: smallint("sensitive_resistant_score"),
  pigmentationScore: smallint("pigmentation_score"),
  wrinkleScore: smallint("wrinkle_score"),

  // Fitzpatrick 간이화
  uvReactionType: text("uv_reaction_type"),

  // 여드름/아토피 중증도 (IGA, POEM 참고)
  acneSeverity: text("acne_severity"),
  eczemaPoemScore: smallint("eczema_poem_score"),

  // D. 생활·환경 요인
  humidityRegion: text("humidity_region"),
  uvExposureHours: numeric("uv_exposure_hours"),
  maskHours: numeric("mask_hours"),
  sleepHours: numeric("sleep_hours"),
  stressLevel: smallint("stress_level"),
  isSmoker: boolean("is_smoker"),

  // F. 스킨케어 목표 — 다중선택 + 우선순위(배열 앞쪽일수록 우선)
  goals: skinGoalEnum("goals").array(),
  goalPriority: skinGoalEnum("goal_priority").array(),

  // 체크인 전용 필드 (섹션 1-②)
  troubleAreas: text("trouble_areas").array(),
  photoUrl: text("photo_url"),
  recentRecommendationSatisfaction: smallint(
    "recent_recommendation_satisfaction",
  ),
  menstrualCycleChange: text("menstrual_cycle_change"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 확정/의심 단계가 있는 성분 제외 리스트. 반복 보고될수록 확정 신뢰도 상승 (PRD 섹션 2)
export const excludedIngredients = pgTable("excluded_ingredients", {
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
});

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
