import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {games} from "./game";
import {gamesToUsers} from "./gamesToUsers";
import {withDates} from "./shared/withDates";


export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  email: varchar("email").unique().notNull(),
  firestoreId: varchar("firestore_id").unique().notNull(),
  aboutMe: varchar("about_me").default(sql`NULL`),
  avatarUrl: varchar("avatar_url").default(sql`NULL`),
  ...withDates,
});

export type SelectUser = typeof users.$inferSelect

export const usersRelations = relations(users, ({many}) => ({
  gamesAsAdmin: many(games),
  gamesAsParticipant: many(gamesToUsers),
  picks: many(gamesToUsers),
}));
