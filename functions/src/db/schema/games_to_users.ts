import {pgTable, uuid} from "drizzle-orm/pg-core";
import {users} from "./user";
import {games} from "./game";
import {relations} from "drizzle-orm";

export const gamesToUsers = pgTable("games_to_users", {
  userId: uuid("user_id").notNull().references(() => users.id),
  gameId: uuid("game_id").notNull().references(() => games.id),
}, (t) => ({
  primaryKey: [t.userId, t.gameId],
}));


export const gamesToUsersRelations = relations(gamesToUsers, ({one}) => ({
  game: one(games, {
    fields: [gamesToUsers.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gamesToUsers.userId],
    references: [users.id],
  }),
}));
