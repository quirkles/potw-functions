import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {gameWeeks} from "./gameWeek";
import {withDates} from "./shared/withDates";
import {users} from "./user";

export const picks = pgTable("picks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firestoreId: varchar("firestore_id").notNull().default("NOT_SET"),
  gameWeekId: uuid("game_week_id").notNull(),
  userId: uuid("user_id").notNull(),
  spotifyTrackId: uuid("spotify_track_id"),
  youtubeVideoId: uuid("youtube_video_id"),
  youtubeTrackId: uuid("youtube_track_id"),
  artist: varchar("artist").notNull(),
  title: varchar("title").notNull(),
  ...withDates,
});

export type SelectPick = typeof picks.$inferSelect;

export const pickRelations = relations(picks, ({one}) => ({
  gameWeek: one(gameWeeks, {
    fields: [picks.gameWeekId],
    references: [gameWeeks.id],
  }),
  user: one(users, {
    fields: [picks.userId],
    references: [users.id],
  }),
}));
