import {drizzle, PostgresJsDatabase} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {mask} from "../../services/utils/string";
import * as game from "../schema/game";
import * as gameWeeks from "../schema/gameWeek";
import * as gamesToUsers from "../schema/gamesToUsers";
import * as pick from "../schema/picks";
import * as users from "../schema/user";
import * as vote from "../schema/votes";

const config = {
  schema: {
    ...users,
    ...game,
    ...gamesToUsers,
    ...gameWeeks,
    ...pick,
    ...vote,
  },
} as const;

let db: PostgresJsDatabase<typeof config>;

export const getDb = () => {
  if (!db) {
    const host = process.env.SQL_DB_HOST;
    const name = process.env.SQL_DB_NAME;
    const port = process.env.SQL_DB_PORT;
    const user = process.env.SQL_DB_USER;
    const password = process.env.SQL_DB_PASSWORD;
    if (
      !host || !name || !port || !user || !password
    ) {
      throw new Error("Missing required config");
    }
    const queryClient = postgres(`postgres://${user}:${password}@${host}:${port}/${name}`);
    console.log(`Connection string: postgres://${user}:${mask(password)}@${mask(host)}:${port}/${name}`);
    db = drizzle(queryClient, config);
  }
  return db;
};
