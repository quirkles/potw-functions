import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar, timestamp} from "drizzle-orm/pg-core";

import {games} from "./game";
import {pick} from "./pick";

export const gameWeeks = pgTable("game_weeks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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
  picks: many(pick),
}));