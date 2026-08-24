CREATE TABLE "ingredient_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredient_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "sensitive_resistant_score";--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "pigmentation_score";--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "wrinkle_score";--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "uv_reaction_type";--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "acne_severity";--> statement-breakpoint
ALTER TABLE "skin_profiles" DROP COLUMN "eczema_poem_score";