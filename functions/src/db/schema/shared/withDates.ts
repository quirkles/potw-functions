import {sql} from "drizzle-orm";
import {timestamp} from "drizzle-orm/pg-core";

export const withDates = {
  createdAt: timestamp("created_at", {mode: "string"}).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", {mode: "string"}).notNull().default(sql`now()`),
};
