ALTER TABLE "games" ADD COLUMN "description" varchar;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;