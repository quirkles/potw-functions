import * as path from "path";
import type { Config } from "drizzle-kit";
import {
    config
} from "dotenv";

const env = process.env.ENV || "local";

console.log("Using environment: ", env)

const envFilePath = path.join(__dirname, `./functions/.env.${env}`);

config({
    path: envFilePath,
})

const {
    SQL_DB_HOST,
    SQL_DB_NAME,
    SQL_DB_PORT,
    SQL_DB_USER,
    SQL_DB_PASSWORD
} = process.env;

if (!SQL_DB_HOST || !SQL_DB_NAME || !SQL_DB_PORT || !SQL_DB_USER || !SQL_DB_PASSWORD) {
    throw new Error("Missing environment variables for SQL database");
}
export default {
    schema: "./functions/src/db/schema",
    out: "./drizzle",
    dbCredentials: {
        url: `postgres://${SQL_DB_USER}:${SQL_DB_PASSWORD}@${SQL_DB_HOST}:${SQL_DB_PORT}/${SQL_DB_NAME}`
    }
} satisfies Config;