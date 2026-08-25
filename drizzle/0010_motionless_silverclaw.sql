CREATE SCHEMA "ingredient_ref";
--> statement-breakpoint
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
