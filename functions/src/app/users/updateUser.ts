import {sqlUserSchema} from "@potw/schemas";
import {eq} from "drizzle-orm";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {getLogger} from "../../functionWrapper";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {UnauthorizedError} from "../../utils/Errors";

export const userUpdateSchema = sqlUserSchema.pick({
  sqlId: true,
  username: true,
  aboutMe: true,
  avatarUrl: true,
}).partial();

export const updateUserRequest = httpHandler(async ({
  body,
  tokenPayload,
}) => {
  const logger = getLogger();
  logger.info("updateUserRequest: begin", {
    body,
    tokenPayload,
  });
  if (body.sqlId !== tokenPayload.sqlId) {
    logger.warning("updateUserRequest: sqlId does not match token", {
      body,
      tokenPayload,
    });
    throw new UnauthorizedError();
  }

  const {sqlId, ...userUpdate} = body;
  const db = getDb();
  await db.update(users).set(userUpdate).where(eq(users.id, sqlId));
  return {
    statusCode: 200,
    response: body,
  };
}, {
  useAppCheck: true,
  requireAuthToken: true,
  bodySchema: userUpdateSchema,
  responseSchema: userUpdateSchema,
  vpcConnector: "psql-connector",
  vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY",
});
