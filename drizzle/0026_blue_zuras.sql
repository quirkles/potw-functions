DO $$ BEGIN
 CREATE TYPE "game_status" AS ENUM('pending', 'active', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "status" "game_status" DEFAULT 'pending' NOT NULL;