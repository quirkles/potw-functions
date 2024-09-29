import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar, boolean, date, time, pgEnum} from "drizzle-orm/pg-core";

import {gameWeeks} from "./gameWeek";
import {gamesToUsers} from "./gamesToUsers";
import {withDates} from "./shared/withDates";
import {users} from "./user";

export const statusEnum = pgEnum("game_status", ["pending", "active", "inactive"]);


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
  status: statusEnum("status").notNull().default("pending"),

  adminId: uuid("adminId").references(() => users.id, {
    onDelete: "cascade",
  }).notNull(),

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
