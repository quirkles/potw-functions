ALTER TABLE "games" ADD COLUMN "firestoreId" varchar DEFAULT 'NOT_SET' NOT NULL;--> statement-breakpoint
ALTER TABLE "game_weeks" ADD COLUMN "firestoreId" varchar DEFAULT 'NOT_SET' NOT NULL;