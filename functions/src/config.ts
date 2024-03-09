import {defineInt, defineString} from "firebase-functions/params";

import {z} from "zod";

const configSchema = z.object({
  env: z.enum(["dev", "local"]),
  webUrl: z.string(),
  jwtSecret: z.string(),
  sqlDatabase: z.object({
    host: z.string(),
    user: z.string(),
    password: z.string(),
    dbName: z.string(),
    port: z.number(),
  }),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | undefined;

const env = defineString("ENV");
const webUrl = defineString("WEB_URL");
const jwtSecret = defineString("JWT_SECRET");

const sqlDatabase = {
  host: defineString("SQL_DB_HOST"),
  dbName: defineString("SQL_DB_NAME"),
  user: defineString("SQL_DB_USER"),
  password: defineString("SQL_DB_PASSWORD"),
  port: defineInt("SQL_DB_PORT"),
};

/**
 * This function retrieves the configuration object. If the configuration object is not yet defined,
 * it defines it using the values from `webUrl` and `jwtSecret` and validates it against `configSchema`.
 *
 * @return {Config} The configuration object.
 */
export function getConfig(): Config {
  if (config) {
    return config;
  }
  const maybeConfig: Config = {
    env: (env.value() || "local") as "dev" | "local",
    webUrl: webUrl.value(),
    jwtSecret: jwtSecret.value(),
    sqlDatabase: {
      host: sqlDatabase.host.value(),
      user: sqlDatabase.user.value(),
      password: sqlDatabase.password.value(),
      dbName: sqlDatabase.dbName.value(),
      port: sqlDatabase.port.value(),
    },
  };

  config = configSchema.parse(maybeConfig);
  return config;
}

