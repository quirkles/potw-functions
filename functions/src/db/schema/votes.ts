import {relations, sql} from "drizzle-orm";
import {pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {picks} from "./picks";
import {users} from "./user";

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firestoreId: varchar("firestore_id").notNull().default("NOT_SET"),
  pickId: uuid("pick_id").notNull(),
  userId: uuid("user_id").notNull(),
});

export const voteRelations = relations(votes, ({one}) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  pick: one(picks, {
    fields: [votes.pickId],
    references: [picks.id],
  }),
}));

export type SelectVote = typeof votes.$inferSelect;
