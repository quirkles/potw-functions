import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";
import {z} from "zod";

import {games} from "./game";
import {gamesToUsers, gamesToUsersSchema} from "./games_to_users";


export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  email: varchar("email").unique().notNull(),
  firestoreId: varchar("firestore_id").unique().notNull(),
});

export type SelectUser = typeof users.$inferSelect

export const usersRelations = relations(users, ({many}) => ({
  gamesAsAdmin: many(games),
  gamesAsParticipant: many(gamesToUsers),
  picks: many(gamesToUsers),
}));


export const userSchema = z.object({
  sqlId: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  firestoreId: z.string(),
  gamesAsAdmin: z.array(gamesToUsersSchema).optional(),
  gamesAsParticipant: z.array(gamesToUsersSchema).optional(),
  picks: z.array(z.object({})).optional(),
});

export type User = z.infer<typeof userSchema>;
