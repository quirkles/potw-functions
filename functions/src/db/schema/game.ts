import {pgTable, uuid, varchar, boolean, date} from "drizzle-orm/pg-core";
import {relations, sql} from "drizzle-orm";

import {users} from "./user";
import {gamesToUsers} from "./games_to_users";


export const games = pgTable("games", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  description: varchar("description"),
  startDate: date("startDate", {mode: "string"}),
  period: varchar("period"),
  isPrivate: boolean("is_private").notNull().default(false),
  adminId: uuid("admin_id").references(() => users.id),
});

export const gamesRelations = relations(games, ({one, many}) => ({
  admin: one(users, {
    fields: [games.adminId],
    references: [users.id],
  }),
  players: many(gamesToUsers),
}));
