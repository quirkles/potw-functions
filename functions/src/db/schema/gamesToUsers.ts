import {relations} from "drizzle-orm";
import {pgTable, uuid, pgEnum} from "drizzle-orm/pg-core";

import {games} from "./game";
import {users} from "./user";

export const statusEnum = pgEnum("user_status_in_game", ["invited", "declined", "active", "inactive"]);

export const gamesToUsers = pgTable("games_to_users", {
  userId: uuid("user_id").notNull().references(() => users.id),
  gameId: uuid("game_id").notNull().references(() => games.id),
  userStatusInGame: statusEnum("user_status_in_game").notNull().default("active"),
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

export type SelectGamesToUsers = typeof gamesToUsers.$inferSelect;
