import * as path from "path";
import type { Config } from "drizzle-kit";
import {
    config
} from "dotenv";
const postgres = require("postgres");
import {drizzle} from "drizzle-orm/postgres-js";
import {migrate} from "drizzle-orm/postgres-js/migrator";

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

async function main(){
    let connectionString = `postgres://${SQL_DB_USER}:${SQL_DB_PASSWORD}@${SQL_DB_HOST}:${SQL_DB_PORT}/${SQL_DB_NAME}?sslmode=require&channel_binding=require`;
    console.log(`Connection string: ${connectionString}`)
    const sql = postgres(connectionString, { max: 1 })
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "drizzle" });
    await sql.end();
}

main().then(() => {
    console.log("Migrations complete");
}).catch((err) => {
    console.error("Error running migrations", err);
    process.exit(1);
});