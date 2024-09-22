import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar, boolean, date, time} from "drizzle-orm/pg-core";

import {gameWeeks} from "./gameWeek";
import {gamesToUsers} from "./games_to_users";
import {withDates} from "./shared/withDates";
import {users} from "./user";


export const games = pgTable("games", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firestoreId: varchar("firestore_id").notNull().default("NOT_SET"),
  name: varchar("name").notNull(),
  description: varchar("description"),
  startDate: date("startDate", {mode: "string"}).notNull(),
  endDate: date("endDate", {mode: "string"}),
  regularScheduledStartTimeUtc: time("regularScheduledStartTimeUtc", {
    withTimezone: false,
  }).notNull().default(sql`'21:00:00'`),
  period: varchar("period").notNull(),
  isPrivate: boolean("isPrivate").notNull().default(false),
  adminId: uuid("adminId").references(() => users.id).notNull(),
  ...withDates,
});

export type SelectGame = typeof games.$inferSelect

export const gamesRelations = relations(games, ({one, many}) => ({
  admin: one(users, {
    fields: [games.adminId],
    references: [users.id],
  }),
  players: many(gamesToUsers),
  gameWeeks: many(gameWeeks),
}));
