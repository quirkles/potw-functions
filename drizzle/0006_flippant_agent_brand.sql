ALTER TABLE "games" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "startDate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "firestore_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "endDate" date;