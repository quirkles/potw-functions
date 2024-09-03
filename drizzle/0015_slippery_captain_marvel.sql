ALTER TABLE "games" ADD COLUMN "updated_at" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pick" ADD COLUMN "updated_at" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" date DEFAULT now() NOT NULL;