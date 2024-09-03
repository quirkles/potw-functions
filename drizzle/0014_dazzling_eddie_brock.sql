ALTER TABLE "games" ADD COLUMN "created_at" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pick" ADD COLUMN "created_at" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" date DEFAULT now() NOT NULL;