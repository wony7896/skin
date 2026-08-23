import type { RoutineProductEntry } from "@/db/schema/profiles";

export type SkinGoal =
  | "brightening"
  | "wrinkle_elasticity"
  | "pore"
  | "hydration"
  | "trouble_care";

export const SKIN_GOAL_LABELS: Record<SkinGoal, string> = {
  brightening: "미백 · 톤업",
  wrinkle_elasticity: "주름 · 탄력",
  pore: "모공",
  hydration: "수분 · 보습",
  trouble_care: "트러블 개선",
};

export type OnboardingData = {
  // A. 기본 피부 특성
  tightnessMinutes: number | null;
  tZoneShineMinutes: number | null;
  poreSize: "small" | "medium" | "large" | null;
  oilinessVisual: "dry" | "normal" | "oily" | "combination" | null;

  // B. 피부 질환 병력
  diagnosedConditions: string[];
  recentProcedures: string;
  medications: { freeTextName: string }[];

  // C. 알레르기·트러블 유발 성분
  reactionTypes: string[];
  suspectedProductNames: string[];
  hadPatchTest: boolean | null;
  atopicFamilyHistory: boolean | null;

  // D. 생활·환경 요인
  humidityRegion: string;
  uvExposureHours: number | null;
  maskHours: number | null;
  sleepHours: number | null;
  stressLevel: number | null;
  isSmoker: boolean | null;

  // E. 현재 루틴
  currentRoutineProducts: RoutineProductEntry[];
  lastNewProductAt: string;

  // F. 스킨케어 목표
  goals: SkinGoal[];
  goalPriority: SkinGoal[];
};

export const emptyOnboardingData: OnboardingData = {
  tightnessMinutes: null,
  tZoneShineMinutes: null,
  poreSize: null,
  oilinessVisual: null,

  diagnosedConditions: [],
  recentProcedures: "",
  medications: [],

  reactionTypes: [],
  suspectedProductNames: [],
  hadPatchTest: null,
  atopicFamilyHistory: null,

  humidityRegion: "",
  uvExposureHours: null,
  maskHours: null,
  sleepHours: null,
  stressLevel: null,
  isSmoker: null,

  currentRoutineProducts: [],
  lastNewProductAt: "",

  goals: [],
  goalPriority: [],
};

export const DIAGNOSED_CONDITIONS = [
  "atopic_dermatitis",
  "seborrheic_dermatitis",
  "rosacea",
  "acne",
] as const;

export const DIAGNOSED_CONDITION_LABELS: Record<string, string> = {
  atopic_dermatitis: "아토피피부염",
  seborrheic_dermatitis: "지루성피부염",
  rosacea: "주사(로제시아)",
  acne: "여드름",
};

export const REACTION_TYPES = [
  "stinging",
  "redness",
  "breakout",
  "hives",
] as const;

export const REACTION_TYPE_LABELS: Record<string, string> = {
  stinging: "따가움",
  redness: "붉어짐",
  breakout: "뾰루지",
  hives: "두드러기",
};

export const ROUTINE_CATEGORIES = [
  "cleansing",
  "toner",
  "essence_serum",
  "cream_lotion",
  "sunscreen_spot",
] as const;

export const ROUTINE_CATEGORY_LABELS: Record<string, string> = {
  cleansing: "클렌징",
  toner: "토너",
  essence_serum: "에센스/세럼",
  cream_lotion: "크림/로션",
  sunscreen_spot: "선크림/스팟케어",
};
