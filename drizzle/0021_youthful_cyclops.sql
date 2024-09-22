ALTER TABLE "games" RENAME COLUMN "firestoreId" TO "firestore_id";--> statement-breakpoint
ALTER TABLE "game_weeks" RENAME COLUMN "firestoreId" TO "firestore_id";--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "firestore_id" varchar DEFAULT 'NOT_SET' NOT NULL;--> statement-breakpoint
ALTER TABLE "vote" ADD COLUMN "firestore_id" varchar DEFAULT 'NOT_SET' NOT NULL;