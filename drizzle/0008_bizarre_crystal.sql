CREATE TYPE "public"."fragrance_level" AS ENUM('none', 'light', 'strong');--> statement-breakpoint
CREATE TYPE "public"."texture" AS ENUM('light', 'medium', 'rich');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "fragrance_level" "fragrance_level" DEFAULT 'light' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "texture" texture DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "color_free" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "fragrance_preference" "fragrance_level";--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "texture_preference" texture;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "prefers_color_free" boolean;