import {onMessagePublished} from "firebase-functions/v2/pubsub";
import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {createLogger} from "../../services/Logger/Logger.pino";
import {v4} from "uuid";
import {getConfig} from "../../config";

const userPayloadSchema = z.object({
  firestoreId: z.string(),
  email: z.string(),
  username: z.string().optional(),
});

type UserPayload = z.infer<typeof userPayloadSchema>;

export const createUser = onMessagePublished("create-user", async (event) => {
  const {
    correlationId = v4(),
    ...payload
  } = event.data.message.json;

  const logger = createLogger({
    name: "createUser",
    labels: {
      functionExecutionId: v4(),
      correlationId,
    },
    shouldLogToConsole: getConfig().env === "local",
  });

  logger.info("createUser: begin", {payload});

  let validated: UserPayload;
  try {
    validated = userPayloadSchema.parse(payload);
  } catch (err) {
    logger.warning("createUser: Error validating user payload", {
      payload,
      error: err,
    });
    return;
  }
  validated.username = validated.username || validated.email;
  const db = getDb();
  await db.insert(users).values(validated);
  logger.info("createUser: inserted", {validated});
});
