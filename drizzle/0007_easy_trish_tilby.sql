CREATE TABLE IF NOT EXISTS "game_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"start_date_time" time NOT NULL,
	"theme" varchar,
	"meeting_link" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pick" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"spotify_track_id" uuid,
	"youtube_video_id" uuid,
	"youtube_track_id" uuid,
	"artist" varchar NOT NULL,
	"title" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
