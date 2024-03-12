import {pgTable, uuid} from "drizzle-orm/pg-core";
import {users} from "./user";
import {games} from "./game";

export const gamesToUsers = pgTable("games_to_users", {
  userId: uuid("user_id").notNull().references(() => users.id),
  groupId: uuid("game_id").notNull().references(() => games.id),
});
