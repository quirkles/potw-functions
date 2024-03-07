import {defineString} from "firebase-functions/params";

import {z} from "zod";

const configSchema = z.object({
  webUrl: z.string(),
  jwtSecret: z.string(),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | undefined;

const webUrl = defineString("WEB_URL");
const jwtSecret = defineString("JWT_SECRET");

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
    webUrl: webUrl.value(),
    jwtSecret: jwtSecret.value(),
  };

  config = configSchema.parse(maybeConfig);
  return config;
}

