CREATE TYPE "public"."pregnancy_status" AS ENUM('none', 'pregnant', 'breastfeeding');--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "past_reactions" jsonb;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "pregnancy_status" "pregnancy_status";