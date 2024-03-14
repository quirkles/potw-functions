import postgres from "postgres";
import {drizzle} from "drizzle-orm/postgres-js";
import {getConfig} from "../config";
import {mask} from "../services/utils/string";

let db: ReturnType<typeof drizzle>| null = null;

export const getDb = (): ReturnType<typeof drizzle> => {
  const {sqlDatabase} = getConfig();
  const {host, port, user, password, dbName} = sqlDatabase;
  if (db === null) {
    const queryClient = postgres(`postgres://${user}:${password}@${host}:${port}/${dbName}`);
    console.log(`Connection string: postgres://${user}:${mask(password)}@${mask(host)}:${port}/${dbName}`);
    db = drizzle(queryClient);
  }
  return db;
};


