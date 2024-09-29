import {z} from "zod";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {pubsubHandler} from "../../functionWrapper/pubsubfunctionWrapper";
import {TopicNames} from "../../services/pubsub";

const userPayloadSchema = z.object({
  firestoreId: z.string(),
  email: z.string(),
  username: z.string().optional(),
});

type UserPayload = z.infer<typeof userPayloadSchema>;

const createUserHandler = async (payload: UserPayload) => {
  const logger = getLogger();
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
};

export const createUser = pubsubHandler(createUserHandler, {
  functionName: "createUser",
  bodySchema: userPayloadSchema,
  topic: TopicNames.CREATE_USER,
});
