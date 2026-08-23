CREATE TYPE "public"."ingredient_status" AS ENUM('suspected', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."input_method" AS ENUM('photo', 'barcode', 'search');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('cleansing', 'toner', 'essence_serum', 'cream_lotion', 'sunscreen_spot');--> statement-breakpoint
CREATE TYPE "public"."profile_source" AS ENUM('onboarding', 'checkin');--> statement-breakpoint
CREATE TYPE "public"."report_source" AS ENUM('onboarding', 'checkin', 'event_report');--> statement-breakpoint
CREATE TYPE "public"."skin_goal" AS ENUM('brightening', 'wrinkle_elasticity', 'pore', 'hydration', 'trouble_care');--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inci_name" text NOT NULL,
	"korean_name" text,
	"cas_number" text,
	"irritant_report_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_inci_name_unique" UNIQUE("inci_name")
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_code" text,
	"name" text NOT NULL,
	"active_ingredient" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medications_standard_code_unique" UNIQUE("standard_code")
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "user_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skin_profile_id" uuid NOT NULL,
	"medication_id" uuid,
	"free_text_name" text,
	"input_method" "input_method" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excluded_ingredients" ADD CONSTRAINT "excluded_ingredients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excluded_ingredients" ADD CONSTRAINT "excluded_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD CONSTRAINT "skin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trouble_reports" ADD CONSTRAINT "trouble_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trouble_reports" ADD CONSTRAINT "trouble_reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_skin_profile_id_skin_profiles_id_fk" FOREIGN KEY ("skin_profile_id") REFERENCES "public"."skin_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_skin_profile_id_skin_profiles_id_fk" FOREIGN KEY ("skin_profile_id") REFERENCES "public"."skin_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_feedback" ADD CONSTRAINT "usage_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_feedback" ADD CONSTRAINT "usage_feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;