import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";
import {users} from "./user";


export const games = pgTable("games", {
  id: uuid("id").primaryKey(),
  name: varchar("name"),
  adminId: uuid("admin_id").references(() => users.id),
});
