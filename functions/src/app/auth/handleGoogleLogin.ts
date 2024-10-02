import {OAuth2Client} from "google-auth-library";
import {sign} from "jsonwebtoken";
import {v4} from "uuid";
import {z} from "zod";

import {getConfig} from "../../config";
import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {httpHandler} from "../../functionWrapper/httpfunctionWrapper";
import {createLogger} from "../../services/Logger/Logger.pino";
import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField} from "../../services/firestore/user";
import {UnauthorizedError} from "../../utils/Errors";

export const handleGoogleLogin = httpHandler(async ({body, headers}) => {
  initializeAppAdmin();
  const client = new OAuth2Client();
  const tokenInfo = await client.getTokenInfo(body.token);
  const logger = createLogger({
    logName: "handleGoogleLogin",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: headers["x-correlation-id"] as string || v4(),
    },
  });
  logger.info("handleGoogleLogin: start", {
    tokenInfo,
  });
  if (!tokenInfo.email) {
    logger.error("handleGoogleLogin: Invalid token", {
      tokenInfo,
    });
    throw new UnauthorizedError("Invalid token");
  }
  const firestoreId = await saveOrGetId(tokenInfo.email);

  const db = getDb();

  logger.info("handleGoogleLogin: retrieved firestoreId", {
    firestoreId,
  });

  const saved = await db.insert(users).values({
    email: tokenInfo.email,
    firestoreId,
  }).returning({insertedId: users.id}).onConflictDoUpdate({
    target: users.email,
    set: {
      email: tokenInfo.email,
    },
  });

  const sqlId = saved[0].insertedId;

  logger.info("handleGoogleLogin: saved sqlId", {
    sqlId,
  });

  await setField(firestoreId, "sqlId", sqlId);

  const payload = {
    email: tokenInfo.email,
    firestoreId,
    sqlId,
  };

  logger.info("handleGoogleLogin: jwt payload", {
    payload,
  });
  const token = sign(payload, getConfig().jwtSecret);
  return {
    response: {token},
  };
}, {
  bodySchema: z.object({
    token: z.string(),
  }),
});
