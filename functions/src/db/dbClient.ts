import postgres from "postgres";
import {drizzle} from "drizzle-orm/postgres-js";
import {getConfig} from "../config";
import {mask} from "../services/utils/string";
import * as game from "./schema/game";
import * as users from "./schema/user";
import * as gamesToUsers from "./schema/games_to_users";

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
    }});
};


