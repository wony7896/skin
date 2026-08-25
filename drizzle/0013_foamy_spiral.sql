ALTER TABLE "ingredients" ADD COLUMN "restriction" text;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "is_eu_prohibited" boolean DEFAULT false NOT NULL;