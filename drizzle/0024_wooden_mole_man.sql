DO $$ BEGIN
 CREATE TYPE "game_week_status" AS ENUM('pending', 'current', 'overdue', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "games_to_users" ALTER COLUMN "user_status_in_game" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "game_weeks" ADD COLUMN "status" "game_week_status" DEFAULT 'pending' NOT NULL;