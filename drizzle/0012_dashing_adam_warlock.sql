CREATE SCHEMA "ingredient_ref";
--> statement-breakpoint
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
