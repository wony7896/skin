ALTER TABLE "skin_profiles" ADD COLUMN "diagnosed_conditions" text[];--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "recent_procedures" text;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "reaction_types" text[];--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "suspected_product_names" text[];--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "had_patch_test" boolean;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "atopic_family_history" boolean;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "current_routine_products" jsonb;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD COLUMN "last_new_product_at" timestamp with time zone;