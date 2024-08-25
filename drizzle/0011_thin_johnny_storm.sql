ALTER TABLE "games" RENAME COLUMN "is_private" TO "isPrivate";--> statement-breakpoint
ALTER TABLE "games" RENAME COLUMN "admin_id" TO "adminId";--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_admin_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_adminId_users_id_fk" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
