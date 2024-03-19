import {pgTable, uuid, varchar, boolean} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";

import {users} from "./user";


export const games = pgTable("games", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  description: varchar("description"),
  isPrivate: boolean("is_private").notNull().default(false),
  adminId: uuid("admin_id").references(() => users.id),
});
