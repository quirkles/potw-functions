import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar, timestamp} from "drizzle-orm/pg-core";

import {games} from "./game";
import {picks} from "./picks";

export const gameWeeks = pgTable("game_weeks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firestoreId: varchar("firestore_id").notNull().default("NOT_SET"),
  gameId: uuid("game_id").notNull(),
  startDateTime: timestamp("start_date_time").notNull(),
  theme: varchar("theme"),
  meetingLink: varchar("meeting_link"),
});

export type SelectGameWeek = typeof gameWeeks.$inferSelect;

export const gameWeeksRelations = relations(gameWeeks, ({one, many}) => ({
  game: one(games, {
    fields: [gameWeeks.gameId],
    references: [games.id],
  }),
  picks: many(picks),
}));
