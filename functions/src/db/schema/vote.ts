import {relations, sql} from "drizzle-orm";
import {pgTable, uuid} from "drizzle-orm/pg-core";

import {picks} from "./picks";
import {users} from "./user";

export const vote = pgTable("vote", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pickId: uuid("pick_id").notNull(),
  userId: uuid("user_id").notNull(),
});

export const voteRelations = relations(vote, ({one}) => ({
  user: one(users, {
    fields: [vote.userId],
    references: [users.id],
  }),
  pick: one(picks, {
    fields: [vote.pickId],
    references: [picks.id],
  }),
}));
