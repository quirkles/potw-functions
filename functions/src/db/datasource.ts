import * as path from "path";
import * as fs from "fs";
import {z} from "zod";

import {getDataSource} from "./DBClient";

const env = process.env.ENVIRONMENT;

if (!env) {
  throw new Error("ENVIRONMENT not set");
}

const dotfilePath = path.join(__dirname, "../..", `.env.${env}`);

const dotfileLines = fs.readFileSync(dotfilePath, "utf-8").split("\n");

const config: Record<string, string> = {};

for (const line of dotfileLines) {
  const trimmedLine = line.trim();
  if (trimmedLine === "") {
    continue;
  }
  const [key, value] = trimmedLine.split("=");
  if (!key || !value) {
    continue;
  }
  config[format(key)] = value;
}

const dbConfigOverrides = {
  host: config.sqlDbHost,
  username: config.sqlDbUser,
  password: config.sqlDbPassword,
  database: config.sqlDbName,
  port: Number(config.sqlDbPort),
};


const configOverrideSchema = z.object({
  host: z.string(),
  username: z.string(),
  password: z.string(),
  database: z.string(),
  port: z.number(),
});

const validated = configOverrideSchema.parse(dbConfigOverrides);

const datasource = getDataSource({...validated, logging: false});
export default datasource;
function format(str: string): string {
  let result = "";
  let nextUpper = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "_") {
      nextUpper = true;
    } else {
      if (nextUpper) {
        result += str[i].toUpperCase();
        nextUpper = false;
      } else {
        result += str[i].toLowerCase();
      }
    }
  }
  return result;
}
