import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {getConfig} from "../config";
import {mask} from "../services/utils/string";

import * as game from "./schema/game";
import * as gameWeeks from "./schema/gameWeek";
import * as gamesToUsers from "./schema/gamesToUsers";
import * as pick from "./schema/picks";
import * as users from "./schema/user";
import * as vote from "./schema/votes";

export const getDb = () => {
  const {sqlDatabase} = getConfig();
  const {host, port, user, password, dbName} = sqlDatabase;
  const queryClient = postgres(`postgres://${user}:${password}@${host}:${port}/${dbName}`);
  console.log(`Connection string: postgres://${user}:${mask(password)}@${mask(host)}:${port}/${dbName}`);
  return drizzle(queryClient, {
    schema: {
      ...users,
      ...game,
      ...gamesToUsers,
      ...gameWeeks,
      ...pick,
      ...vote,
    }});
};


