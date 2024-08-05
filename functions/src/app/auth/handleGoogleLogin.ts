import {onRequest} from "firebase-functions/v2/https";

import {sign} from "jsonwebtoken";

import {OAuth2Client} from "google-auth-library";

import {getConfig} from "../../config";

import {initializeAppAdmin} from "../../services/firebase";
import {saveOrGetId, setField} from "../../services/firestore/user";

import {getDb} from "../../db/dbClient";
import {users} from "../../db/schema/user";
import {createLogger} from "../../services/Logger/Logger.pino";
import {v4} from "uuid";

export const handleGoogleLogin = onRequest({
  cors: true,
}, async (request, response) => {
  initializeAppAdmin();
  const client = new OAuth2Client();
  const tokenInfo = await client.getTokenInfo(request.body.token);
  const logger = createLogger({
    logName: "handleGoogleLogin",
    shouldLogToConsole: getConfig().env === "local",
    labels: {
      functionExecutionId: v4(),
      correlationId: request.headers["x-correlation-id"] as string || v4(),
    },
  });
  logger.info("handleGoogleLogin: start", {
    tokenInfo,
  });
  if (!tokenInfo.email) {
    logger.error("handleGoogleLogin: Invalid token", {
      tokenInfo,
    });
    response.status(401).send("handleGoogleLogin: Invalid token");
    return;
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
  response.json({token});
  return;
});
