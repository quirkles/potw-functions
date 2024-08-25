import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {gameWeeks} from "./gameWeek";
import {users} from "./user";

export const pick = pgTable("pick", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  gameWeekId: uuid("game_week_id").notNull(),
  userId: uuid("user_id").notNull(),
  spotifyTrackId: uuid("spotify_track_id"),
  youtubeVideoId: uuid("youtube_video_id"),
  youtubeTrackId: uuid("youtube_track_id"),
  artist: varchar("artist").notNull(),
  title: varchar("title").notNull(),
});

export const pickRelations = relations(pick, ({one, many}) => ({
  gameWeek: one(gameWeeks, {
    fields: [pick.gameWeekId],
    references: [gameWeeks.id],
  }),
  user: one(users, {
    fields: [pick.userId],
    references: [users.id],
  }),
}));
