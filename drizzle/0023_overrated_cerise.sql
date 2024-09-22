DO $$ BEGIN
 CREATE TYPE "user_status_in_game" AS ENUM('invited', 'declined', 'active', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "games_to_users" ADD COLUMN "user_status_in_game" "user_status_in_game" NOT NULL DEFAULT 'active';