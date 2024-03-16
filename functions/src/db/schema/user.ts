import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";


export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  email: varchar("email").unique(),
  firestoreId: varchar("firestore_id").unique(),
});
