-- Baseline schema — squashed from drizzle/0000_*.sql … drizzle/0021_*.sql (pre-launch).
-- Reproduces the full schema on an empty database: tables, enums, RLS, storage policies,
-- and the delete_current_user() function. Post-baseline changes go in later migrations.
-- The original per-step files are kept in git history under drizzle/.


-- ============================================================
-- drizzle/0000_white_warpath.sql
-- ============================================================
CREATE TYPE "public"."ingredient_status" AS ENUM('suspected', 'confirmed');
CREATE TYPE "public"."input_method" AS ENUM('photo', 'barcode', 'search');
CREATE TYPE "public"."product_category" AS ENUM('cleansing', 'toner', 'essence_serum', 'cream_lotion', 'sunscreen_spot');
CREATE TYPE "public"."profile_source" AS ENUM('onboarding', 'checkin');
CREATE TYPE "public"."report_source" AS ENUM('onboarding', 'checkin', 'event_report');
CREATE TYPE "public"."skin_goal" AS ENUM('brightening', 'wrinkle_elasticity', 'pore', 'hydration', 'trouble_care');
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inci_name" text NOT NULL,
	"korean_name" text,
	"cas_number" text,
	"irritant_report_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_inci_name_unique" UNIQUE("inci_name")
);

CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_code" text,
	"name" text NOT NULL,
	"active_ingredient" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medications_standard_code_unique" UNIQUE("standard_code")
);

CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"position" integer NOT NULL
);

CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category" "product_category" NOT NULL,
	"retailer" text,
	"external_url" text NOT NULL,
	"barcode" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "excluded_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"status" "ingredient_status" DEFAULT 'suspected' NOT NULL,
	"source" "report_source" NOT NULL,
	"report_count" integer DEFAULT 1 NOT NULL,
	"first_reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reported_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "skin_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "profile_source" NOT NULL,
	"tightness_minutes" numeric,
	"t_zone_shine_minutes" numeric,
	"pore_size" text,
	"oiliness_visual" text,
	"oily_dry_score" smallint,
	"sensitive_resistant_score" smallint,
	"pigmentation_score" smallint,
	"wrinkle_score" smallint,
	"uv_reaction_type" text,
	"acne_severity" text,
	"eczema_poem_score" smallint,
	"humidity_region" text,
	"uv_exposure_hours" numeric,
	"mask_hours" numeric,
	"sleep_hours" numeric,
	"stress_level" smallint,
	"is_smoker" boolean,
	"goals" "skin_goal"[],
	"goal_priority" "skin_goal"[],
	"trouble_areas" text[],
	"photo_url" text,
	"recent_recommendation_satisfaction" smallint,
	"menstrual_cycle_change" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "trouble_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"onset_days" integer,
	"body_area" text,
	"severity" smallint NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "user_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skin_profile_id" uuid NOT NULL,
	"medication_id" uuid,
	"free_text_name" text,
	"input_method" "input_method" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skin_profile_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"category" "product_category" NOT NULL,
	"safety_passed" boolean NOT NULL,
	"goal_fit_score" numeric,
	"reason" text,
	"recommended_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "usage_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"satisfaction_score" smallint,
	"had_trouble" boolean,
	"repurchase_intent" boolean,
	"feedback_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "excluded_ingredients" ADD CONSTRAINT "excluded_ingredients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "excluded_ingredients" ADD CONSTRAINT "excluded_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "skin_profiles" ADD CONSTRAINT "skin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "trouble_reports" ADD CONSTRAINT "trouble_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "trouble_reports" ADD CONSTRAINT "trouble_reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_skin_profile_id_skin_profiles_id_fk" FOREIGN KEY ("skin_profile_id") REFERENCES "public"."skin_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_skin_profile_id_skin_profiles_id_fk" FOREIGN KEY ("skin_profile_id") REFERENCES "public"."skin_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "usage_feedback" ADD CONSTRAINT "usage_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "usage_feedback" ADD CONSTRAINT "usage_feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;
-- ============================================================
-- drizzle/0001_wonderful_satana.sql
-- ============================================================
ALTER TABLE "skin_profiles" ADD COLUMN "diagnosed_conditions" text[];
ALTER TABLE "skin_profiles" ADD COLUMN "recent_procedures" text;
ALTER TABLE "skin_profiles" ADD COLUMN "reaction_types" text[];
ALTER TABLE "skin_profiles" ADD COLUMN "suspected_product_names" text[];
ALTER TABLE "skin_profiles" ADD COLUMN "had_patch_test" boolean;
ALTER TABLE "skin_profiles" ADD COLUMN "atopic_family_history" boolean;
ALTER TABLE "skin_profiles" ADD COLUMN "current_routine_products" jsonb;
ALTER TABLE "skin_profiles" ADD COLUMN "last_new_product_at" timestamp with time zone;
-- ============================================================
-- drizzle/0002_hard_echo.sql
-- ============================================================
ALTER TABLE "excluded_ingredients" ADD CONSTRAINT "excluded_ingredients_user_id_ingredient_id_unique" UNIQUE("user_id","ingredient_id");
-- ============================================================
-- drizzle/0003_faithful_bastion.sql
-- ============================================================
ALTER TABLE "skin_profiles" ADD COLUMN "redness_level" smallint;
ALTER TABLE "skin_profiles" ADD COLUMN "flaking_level" smallint;
-- ============================================================
-- drizzle/0004_amusing_black_tarantula.sql
-- ============================================================
ALTER TABLE "products" ADD COLUMN "country" text DEFAULT 'KR' NOT NULL;
-- ============================================================
-- drizzle/0005_huge_sabra.sql
-- ============================================================
CREATE TYPE "public"."consent_type" AS ENUM('sensitive_health_info', 'biometric_photo');
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_consents_user_id_consent_type_unique" UNIQUE("user_id","consent_type")
);

ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
-- ============================================================
-- drizzle/0006_rich_wild_pack.sql
-- ============================================================
CREATE TYPE "public"."pregnancy_status" AS ENUM('none', 'pregnant', 'breastfeeding');
ALTER TABLE "skin_profiles" ADD COLUMN "past_reactions" jsonb;
ALTER TABLE "skin_profiles" ADD COLUMN "pregnancy_status" "pregnancy_status";
-- ============================================================
-- drizzle/0007_blushing_mephistopheles.sql
-- ============================================================
ALTER TABLE "skin_profiles" DROP COLUMN "reaction_types";
ALTER TABLE "skin_profiles" DROP COLUMN "suspected_product_names";
-- ============================================================
-- drizzle/0008_bizarre_crystal.sql
-- ============================================================
CREATE TYPE "public"."fragrance_level" AS ENUM('none', 'light', 'strong');
CREATE TYPE "public"."texture" AS ENUM('light', 'medium', 'rich');
ALTER TABLE "products" ADD COLUMN "fragrance_level" "fragrance_level" DEFAULT 'light' NOT NULL;
ALTER TABLE "products" ADD COLUMN "texture" texture DEFAULT 'medium' NOT NULL;
ALTER TABLE "products" ADD COLUMN "color_free" boolean DEFAULT true NOT NULL;
ALTER TABLE "skin_profiles" ADD COLUMN "fragrance_preference" "fragrance_level";
ALTER TABLE "skin_profiles" ADD COLUMN "texture_preference" texture;
ALTER TABLE "skin_profiles" ADD COLUMN "prefers_color_free" boolean;
-- ============================================================
-- drizzle/0009_furry_network.sql
-- ============================================================
CREATE TABLE "ingredient_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredient_aliases_alias_unique" UNIQUE("alias")
);

ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "skin_profiles" DROP COLUMN "sensitive_resistant_score";
ALTER TABLE "skin_profiles" DROP COLUMN "pigmentation_score";
ALTER TABLE "skin_profiles" DROP COLUMN "wrinkle_score";
ALTER TABLE "skin_profiles" DROP COLUMN "uv_reaction_type";
ALTER TABLE "skin_profiles" DROP COLUMN "acne_severity";
ALTER TABLE "skin_profiles" DROP COLUMN "eczema_poem_score";
-- ============================================================
-- drizzle/0010_motionless_silverclaw.sql
-- ============================================================
CREATE SCHEMA "ingredient_ref";

CREATE TABLE "ingredient_ref"."cosing_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"substance_id" text,
	"cas_no" text,
	"ec_no" text,
	"pubchem_cid" integer,
	"pubchem_url" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- drizzle/0011_lyrical_red_skull.sql
-- ============================================================
DROP TABLE "ingredient_ref"."cosing_ingredients" CASCADE;
DROP SCHEMA "ingredient_ref";

-- ============================================================
-- drizzle/0012_dashing_adam_warlock.sql
-- ============================================================
CREATE SCHEMA "ingredient_ref";

CREATE TABLE "ingredient_ref"."cosing_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"cosing_ref_no" text,
	"inci_name" text NOT NULL,
	"inn_name" text,
	"ph_eur_name" text,
	"cas_no" text,
	"einecs_no" text,
	"description" text,
	"restriction" text,
	"function_raw" text,
	"functions" text[],
	"update_date" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- drizzle/0013_foamy_spiral.sql
-- ============================================================
ALTER TABLE "ingredients" ADD COLUMN "restriction" text;
ALTER TABLE "ingredients" ADD COLUMN "is_eu_prohibited" boolean DEFAULT false NOT NULL;
-- ============================================================
-- drizzle/0014_fuzzy_black_crow.sql
-- ============================================================
ALTER TABLE "ingredients" ADD COLUMN "is_restricted_fragrance" boolean DEFAULT false NOT NULL;
-- ============================================================
-- drizzle/0015_violet_karen_page.sql
-- ============================================================
ALTER TABLE "ingredients" ADD COLUMN "is_known_fragrance_allergen" boolean DEFAULT false NOT NULL;
ALTER TABLE "ingredients" ADD COLUMN "is_uv_filter" boolean DEFAULT false NOT NULL;
-- ============================================================
-- drizzle/0016_chemical_silver_samurai.sql
-- ============================================================
ALTER TABLE "ingredients" ADD COLUMN "is_approved_preservative" boolean DEFAULT false NOT NULL;
-- ============================================================
-- drizzle/0017_enable_rls.sql
-- ============================================================
-- 참조/공용 데이터: 전체 조회 허용, 쓰기는 service_role만 (RLS는 켜두되 별도 쓰기 정책 없음)
ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_public_read" ON "public"."ingredients" FOR SELECT USING (true);

ALTER TABLE "public"."medications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_public_read" ON "public"."medications" FOR SELECT USING (true);

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON "public"."products" FOR SELECT USING (true);

ALTER TABLE "public"."product_ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_ingredients_public_read" ON "public"."product_ingredients" FOR SELECT USING (true);

-- 사용자 소유 데이터: 본인 행만 조회/작성/수정/삭제 가능
ALTER TABLE "public"."skin_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skin_profiles_owner" ON "public"."skin_profiles" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."excluded_ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "excluded_ingredients_owner" ON "public"."excluded_ingredients" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."trouble_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trouble_reports_owner" ON "public"."trouble_reports" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."user_medications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_medications_owner" ON "public"."user_medications" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."recommendations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendations_owner" ON "public"."recommendations" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."usage_feedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_feedback_owner" ON "public"."usage_feedback" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- drizzle/0018_skin_photos_storage.sql
-- ============================================================
-- 피부 사진 업로드용 비공개 버킷. 체크인(섹션 1-②)과 이벤트 리포트(섹션 1-③)의
-- "사진 업로드(선택)" 항목을 지원한다. public=false이며, 서명된 URL로만 조회 가능.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('skin-photos', 'skin-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 본인 폴더(userId/...)에만 업로드·조회·삭제 가능
CREATE POLICY "skin_photos_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "skin_photos_owner_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "skin_photos_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- drizzle/0019_user_consents_rls.sql
-- ============================================================
ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_consents_owner" ON "public"."user_consents" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- drizzle/0020_ingredient_ref_rls.sql
-- ============================================================
CREATE INDEX cosing_ingredients_lower_inci_name_idx ON ingredient_ref.cosing_ingredients (lower(inci_name));
CREATE INDEX cosing_ingredients_cas_no_idx ON ingredient_ref.cosing_ingredients (cas_no) WHERE cas_no IS NOT NULL;
CREATE INDEX cosing_ingredients_functions_gin_idx ON ingredient_ref.cosing_ingredients USING gin (functions);

ALTER TABLE ingredient_ref.cosing_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cosing_ingredients_public_read" ON ingredient_ref.cosing_ingredients FOR SELECT USING (true);

-- ============================================================
-- drizzle/0021_delete_current_user.sql
-- ============================================================
-- 회원탈퇴(개인정보보호법상 파기·동의철회 수단).
-- 본인 계정(auth.users)을 삭제하면 user_id를 FK로 참조하는 모든 public 테이블
-- 행이 ON DELETE CASCADE로 함께 삭제된다: skin_profiles, excluded_ingredients,
-- trouble_reports, user_medications, recommendations, usage_feedback,
-- user_consents. 스토리지(skin-photos 버킷)의 사용자 파일은 FK가 없으므로
-- 서버 액션(deleteAccount)에서 먼저 삭제한다.
--
-- anon 키 + 사용자 JWT만 있는 실행 환경(PostgREST 경유 supabase.rpc)에서도
-- 호출 가능하도록 security definer로 두고, 실행 권한은 authenticated에만 준다.
-- auth.uid()로 호출자 본인만 삭제하므로 다른 사용자 계정은 건드릴 수 없다.
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;
